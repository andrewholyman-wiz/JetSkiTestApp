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
        ECR_REPOSITORY  = 'civitas'
        EKS_CLUSTER     = 'wiz-eks-cluster'
        IMAGE_URI       = '248812876103.dkr.ecr.us-east-1.amazonaws.com/civitas'
        WIZCLI_DIR      = '/var/lib/jenkins/.tools'
        WIZCLI_BIN      = '/var/lib/jenkins/.tools/wizcli'
        GIT_REPO_SLUG   = 'andrewholyman-wiz/JetSkiTestApp'
    }

    stages {
        stage('Inspect Checkout') {
            steps {
                sh '''
                    set -euo pipefail
                    echo "Commit: $(git rev-parse --short HEAD) ($(git rev-parse HEAD))"
                    echo "Jenkins URL: ${JENKINS_URL:-<unset>} | Job: ${JOB_NAME:-<unset>} | Build: ${BUILD_URL:-<unset>}"
                    echo "Git Branch: ${GIT_BRANCH:-<unset>} | Git URL: ${GIT_URL:-<unset>}"
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
                        export GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse HEAD)}"
                        export GIT_URL="${GIT_URL:-https://github.com/${GIT_REPO_SLUG}.git}"
                        RESOLVED_BRANCH="${GIT_BRANCH:-${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
                        RESOLVED_BRANCH="${RESOLVED_BRANCH#origin/}"
                        if [ "${RESOLVED_BRANCH}" = "HEAD" ] || [ -z "${RESOLVED_BRANCH}" ]; then
                            RESOLVED_BRANCH="main"
                        fi
                        export GIT_BRANCH="${RESOLVED_BRANCH}"
                        export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git log -1 --format='%ae')}"
                        if [ -z "${JENKINS_URL:-}" ]; then
                            export WIZ_CI_COLLECT_PARAMS=true
                            export WIZ_CI_REPO="${GIT_URL}"
                            export WIZ_CI_BRANCH_NAME="${GIT_BRANCH}"
                            export WIZ_CI_COMMIT_HASH="${GIT_COMMIT}"
                            export WIZ_CI_USERNAME="${GIT_AUTHOR_EMAIL}"
                            export WIZ_CI_JOB_NAME="${JOB_NAME:-JetSkiTestApp}"
                            export WIZ_CI_JOB_URL="${BUILD_URL:-}"
                        fi

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
                        export GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse HEAD)}"
                        export GIT_URL="${GIT_URL:-https://github.com/${GIT_REPO_SLUG}.git}"
                        RESOLVED_BRANCH="${GIT_BRANCH:-${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
                        RESOLVED_BRANCH="${RESOLVED_BRANCH#origin/}"
                        if [ "${RESOLVED_BRANCH}" = "HEAD" ] || [ -z "${RESOLVED_BRANCH}" ]; then
                            RESOLVED_BRANCH="main"
                        fi
                        export GIT_BRANCH="${RESOLVED_BRANCH}"
                        export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git log -1 --format='%ae')}"
                        if [ -z "${JENKINS_URL:-}" ]; then
                            export WIZ_CI_COLLECT_PARAMS=true
                            export WIZ_CI_REPO="${GIT_URL}"
                            export WIZ_CI_BRANCH_NAME="${GIT_BRANCH}"
                            export WIZ_CI_COMMIT_HASH="${GIT_COMMIT}"
                            export WIZ_CI_USERNAME="${GIT_AUTHOR_EMAIL}"
                            export WIZ_CI_JOB_NAME="${JOB_NAME:-JetSkiTestApp}"
                            export WIZ_CI_JOB_URL="${BUILD_URL:-}"
                        fi

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

        stage('WizCLI Tag Image for C2C') {
            steps {
                withCredentials([
                    string(credentialsId: 'wiz-client-id', variable: 'WIZ_CLIENT_ID'),
                    string(credentialsId: 'wiz-client-secret', variable: 'WIZ_CLIENT_SECRET')
                ]) {
                    sh '''
                        set -euo pipefail
                        export GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse HEAD)}"
                        export GIT_URL="${GIT_URL:-https://github.com/${GIT_REPO_SLUG}.git}"
                        RESOLVED_BRANCH="${GIT_BRANCH:-${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
                        RESOLVED_BRANCH="${RESOLVED_BRANCH#origin/}"
                        if [ "${RESOLVED_BRANCH}" = "HEAD" ] || [ -z "${RESOLVED_BRANCH}" ]; then
                            RESOLVED_BRANCH="main"
                        fi
                        export GIT_BRANCH="${RESOLVED_BRANCH}"
                        export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git log -1 --format='%ae')}"
                        if [ -z "${JENKINS_URL:-}" ]; then
                            export WIZ_CI_COLLECT_PARAMS=true
                            export WIZ_CI_REPO="${GIT_URL}"
                            export WIZ_CI_BRANCH_NAME="${GIT_BRANCH}"
                            export WIZ_CI_COMMIT_HASH="${GIT_COMMIT}"
                            export WIZ_CI_USERNAME="${GIT_AUTHOR_EMAIL}"
                            export WIZ_CI_JOB_NAME="${JOB_NAME:-JetSkiTestApp}"
                            export WIZ_CI_JOB_URL="${BUILD_URL:-}"
                        fi

                        docker images --digests "${IMAGE_URI}"
                        IMAGE_DIGEST=$(docker inspect --format='{{range .RepoDigests}}{{println .}}{{end}}' "${IMAGE_URI}:${BUILD_NUMBER}" \
                            | grep "^${IMAGE_URI}@" | head -n 1 | cut -d@ -f2)

                        if [ -z "${IMAGE_DIGEST}" ]; then
                            echo "ERROR: Could not resolve ECR RepoDigest for ${IMAGE_URI}:${BUILD_NUMBER}" >&2
                            docker inspect --format='{{json .RepoDigests}}' "${IMAGE_URI}:${BUILD_NUMBER}" >&2
                            exit 1
                        fi

                        echo "Tagging scanned image ${IMAGE_URI}:${BUILD_NUMBER} with digest ${IMAGE_DIGEST} in Wiz..."
                        "${WIZCLI_BIN}" auth --id "${WIZ_CLIENT_ID}" --secret "${WIZ_CLIENT_SECRET}"
                        "${WIZCLI_BIN}" tag "${IMAGE_URI}:${BUILD_NUMBER}" --digest="${IMAGE_DIGEST}"
                    '''
                }
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
