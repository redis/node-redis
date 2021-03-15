pipeline {
     agent any

    stages {
        stage('build') {
            steps("run frontend") {
               echo 'building the application....'
               echo 'executing npm'
               nodejs('Node-15.11') {
                   sh 'npm install'
               }
            }
        }

    stage('test') {
            steps {
               echo 'testing the application...'
            }
        }

    stage('deploy') {
            steps {
               echo 'deploying the application'
               echo 'checking again'
            }
        }
    }
}
