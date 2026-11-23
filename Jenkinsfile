pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        AWS_REGION      = 'us-east-1'
        AWS_ACCOUNT_ID  = '248812876103'
        ECR_REGISTRY    = '248812876103.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPOSITORY  = 'jenkins-demo-app'
        EKS_CLUSTER     = 'wiz-eks-cluster'
        IMAGE_URI       = '248812876103.dkr.ecr.us-east-1.amazonaws.com/jenkins-demo-app'
        WIZCLI_DIR      = '/var/lib/jenkins/.tools'
        WIZCLI_BIN      = '/var/lib/jenkins/.tools/wizcli'
        GIT_REPO_SLUG   = 'andrewholyman-wiz/JetSkiTestApp'
    }

    stages {
        stage('Inspect Checkout') {
            steps {
                sh '''
                    set -euo pipefail
                    echo "Commit: $(git rev-parse --short HEAD)"
                    git log -1 --oneline
                    ls -la
                '''
            }
        }

        stage('Install WizCLI') {
            steps {
                sh '''
                    set -euo pipefail
                    mkdir -p "${WIZCLI_DIR}"
                    curl -fsSL -z "${WIZCLI_BIN}" -o "${WIZCLI_BIN}" https://downloads.wiz.io/v1/wizcli/latest/wizcli-linux-arm64
                    chmod +x "${WIZCLI_BIN}"
                    "${WIZCLI_BIN}" version
                '''
            }
        }

        stage('WizCLI Repo / IaC Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'wiz-client-id', variable: 'WIZ_CLIENT_ID'),
                    string(credentialsId: 'wiz-client-secret', variable: 'WIZ_CLIENT_SECRET')
                ]) {
                    sh '''
                        set -euo pipefail
                        GIT_SHORT=$(git rev-parse --short HEAD)
                        "${WIZCLI_BIN}" auth --id "${WIZ_CLIENT_ID}" --secret "${WIZ_CLIENT_SECRET}"
                        "${WIZCLI_BIN}" scan dir . \
                            --tag "git_repo=${GIT_REPO_SLUG}" \
                            --tag "git_commit=${GIT_SHORT}" \
                            --json-output-file wiz-dir-scan-report.json || true
                    '''
                }
                archiveArtifacts artifacts: 'wiz-dir-scan-report.json', allowEmptyArchive: true
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -euo pipefail
                    GIT_SHORT=$(git rev-parse --short HEAD)
                    docker build \
                        --build-arg "BUILD_NUMBER=${BUILD_NUMBER}" \
                        --build-arg "GIT_COMMIT=${GIT_SHORT}" \
                        -t "${IMAGE_URI}:${BUILD_NUMBER}" \
                        -t "${IMAGE_URI}:git-${GIT_SHORT}" \
                        -t "${IMAGE_URI}:latest" \
                        .
                '''
            }
        }

        stage('WizCLI Container Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'wiz-client-id', variable: 'WIZ_CLIENT_ID'),
                    string(credentialsId: 'wiz-client-secret', variable: 'WIZ_CLIENT_SECRET')
                ]) {
                    sh '''
                        set -euo pipefail
                        GIT_SHORT=$(git rev-parse --short HEAD)
                        "${WIZCLI_BIN}" auth --id "${WIZ_CLIENT_ID}" --secret "${WIZ_CLIENT_SECRET}"
                        "${WIZCLI_BIN}" scan container-image "${IMAGE_URI}:${BUILD_NUMBER}" \
                            --dockerfile Dockerfile \
                            --tag "git_repo=${GIT_REPO_SLUG}" \
                            --tag "git_commit=${GIT_SHORT}" \
                            --json-output-file wiz-image-scan-report.json
                    '''
                }
                archiveArtifacts artifacts: 'wiz-image-scan-report.json', allowEmptyArchive: true
            }
        }

        stage('Push Image to Amazon ECR') {
            steps {
                sh '''
                    set -euo pipefail
                    GIT_SHORT=$(git rev-parse --short HEAD)
                    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
                    docker push "${IMAGE_URI}:${BUILD_NUMBER}"
                    docker push "${IMAGE_URI}:git-${GIT_SHORT}"
                    docker push "${IMAGE_URI}:latest"
                '''
            }
        }

        stage('Deploy to Amazon EKS') {
            steps {
                sh '''
                    set -euo pipefail
                    aws eks update-kubeconfig --region "${AWS_REGION}" --name "${EKS_CLUSTER}"
                    sed "s|__IMAGE_URI__|${IMAGE_URI}:${BUILD_NUMBER}|g" k8s/deployment.yaml > k8s-rendered.yaml
                    kubectl apply -f k8s-rendered.yaml
                    kubectl -n demo-app rollout status deployment/jenkins-demo-app --timeout=120s
                    kubectl -n demo-app get pods,svc,pdb -o wide
                '''
            }
        }
    }

    post {
        always {
            sh '''
                GIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "")
                docker rmi "${IMAGE_URI}:${BUILD_NUMBER}" "${IMAGE_URI}:latest" ${GIT_SHORT:+"${IMAGE_URI}:git-${GIT_SHORT}"} 2>/dev/null || true
                rm -f k8s-rendered.yaml
            '''
        }
    }
}
