{{/*
Expand the name of the chart.
*/}}
{{- define "clinic-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "clinic-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "clinic-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "clinic-app.labels" -}}
helm.sh/chart: {{ include "clinic-app.chart" . }}
{{ include "clinic-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: clinic-app
{{- end }}

{{/*
Selector labels
*/}}
{{- define "clinic-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "clinic-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service labels for a specific component
*/}}
{{- define "clinic-app.serviceLabels" -}}
{{ include "clinic-app.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "clinic-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "clinic-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate image name for a service
*/}}
{{- define "clinic-app.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry -}}
{{- $repository := .service.image.repository | default .service.name -}}
{{- $tag := .service.image.tag | default .Values.image.tag | default .Chart.AppVersion -}}
{{- if $registry }}
{{- printf "%s/%s/%s:%s" $registry .Values.image.repository $repository $tag }}
{{- else }}
{{- printf "%s/%s:%s" .Values.image.repository $repository $tag }}
{{- end }}
{{- end }}

{{/*
Generate full service name
*/}}
{{- define "clinic-app.serviceName" -}}
{{- printf "%s-%s" (include "clinic-app.fullname" .) .serviceName }}
{{- end }}

{{/*
Generate environment variables for services
*/}}
{{- define "clinic-app.envVars" -}}
- name: NODE_ENV
  value: {{ .Values.environment | quote }}
- name: NAMESPACE
  valueFrom:
    fieldRef:
      fieldPath: metadata.namespace
- name: POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
- name: POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
{{- if .Values.postgresql.enabled }}
- name: POSTGRES_HOST
  value: {{ include "clinic-app.fullname" . }}-postgresql
- name: POSTGRES_PORT
  value: "5432"
- name: POSTGRES_DB
  value: {{ .Values.postgresql.auth.database | quote }}
- name: POSTGRES_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-postgresql
      key: username
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-postgresql
      key: password
{{- end }}
{{- if .Values.redis.enabled }}
- name: REDIS_HOST
  value: {{ include "clinic-app.fullname" . }}-redis-master
- name: REDIS_PORT
  value: "6379"
{{- if .Values.redis.auth.enabled }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-redis
      key: redis-password
{{- end }}
{{- end }}
{{- if .Values.nats.enabled }}
- name: NATS_URL
  value: nats://{{ include "clinic-app.fullname" . }}-nats:4222
{{- if .Values.nats.auth.enabled }}
- name: NATS_USER
  value: {{ .Values.nats.auth.user | quote }}
- name: NATS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-nats
      key: password
{{- end }}
{{- end }}
{{- if .Values.minio.enabled }}
- name: S3_ENDPOINT
  value: http://{{ include "clinic-app.fullname" . }}-minio:9000
- name: S3_ACCESS_KEY
  value: {{ .Values.minio.auth.rootUser | quote }}
- name: S3_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-minio
      key: root-password
{{- end }}
{{- if .Values.secrets.manual.enabled }}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-app-secrets
      key: JWT_SECRET
- name: SESSION_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-app-secrets
      key: SESSION_SECRET_KEY
- name: OPENAI_API_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-app-secrets
      key: OPENAI_API_KEY
- name: COOKIE_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "clinic-app.fullname" . }}-app-secrets
      key: COOKIE_SECRET
{{- end }}
{{- end }}

{{/*
Generate security context
*/}}
{{- define "clinic-app.securityContext" -}}
{{- toYaml .Values.securityContext }}
{{- end }}

{{/*
Generate pod security context
*/}}
{{- define "clinic-app.podSecurityContext" -}}
{{- toYaml .Values.podSecurityContext }}
{{- end }}

{{/*
Generate resource limits and requests
*/}}
{{- define "clinic-app.resources" -}}
{{- if .resources }}
{{- toYaml .resources }}
{{- else }}
{{- toYaml .Values.resources }}
{{- end }}
{{- end }}

{{/*
Generate node selector
*/}}
{{- define "clinic-app.nodeSelector" -}}
{{- with .Values.nodeSelector }}
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Generate affinity
*/}}
{{- define "clinic-app.affinity" -}}
{{- with .Values.affinity }}
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Generate tolerations
*/}}
{{- define "clinic-app.tolerations" -}}
{{- with .Values.tolerations }}
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Generate image pull secrets
*/}}
{{- define "clinic-app.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Generate liveness probe
*/}}
{{- define "clinic-app.livenessProbe" -}}
{{- if .Values.healthChecks.livenessProbe.enabled }}
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: {{ .Values.healthChecks.livenessProbe.initialDelaySeconds }}
  periodSeconds: {{ .Values.healthChecks.livenessProbe.periodSeconds }}
  timeoutSeconds: {{ .Values.healthChecks.livenessProbe.timeoutSeconds }}
  failureThreshold: {{ .Values.healthChecks.livenessProbe.failureThreshold }}
  successThreshold: {{ .Values.healthChecks.livenessProbe.successThreshold }}
{{- end }}
{{- end }}

{{/*
Generate readiness probe
*/}}
{{- define "clinic-app.readinessProbe" -}}
{{- if .Values.healthChecks.readinessProbe.enabled }}
readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: {{ .Values.healthChecks.readinessProbe.initialDelaySeconds }}
  periodSeconds: {{ .Values.healthChecks.readinessProbe.periodSeconds }}
  timeoutSeconds: {{ .Values.healthChecks.readinessProbe.timeoutSeconds }}
  failureThreshold: {{ .Values.healthChecks.readinessProbe.failureThreshold }}
  successThreshold: {{ .Values.healthChecks.readinessProbe.successThreshold }}
{{- end }}
{{- end }}

{{/*
Generate startup probe
*/}}
{{- define "clinic-app.startupProbe" -}}
{{- if .Values.healthChecks.startupProbe.enabled }}
startupProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: {{ .Values.healthChecks.startupProbe.initialDelaySeconds }}
  periodSeconds: {{ .Values.healthChecks.startupProbe.periodSeconds }}
  timeoutSeconds: {{ .Values.healthChecks.startupProbe.timeoutSeconds }}
  failureThreshold: {{ .Values.healthChecks.startupProbe.failureThreshold }}
  successThreshold: {{ .Values.healthChecks.startupProbe.successThreshold }}
{{- end }}
{{- end }}

{{/*
Generate common annotations
*/}}
{{- define "clinic-app.annotations" -}}
app.kubernetes.io/part-of: clinic-app
app.kubernetes.io/managed-by: helm
deployment.kubernetes.io/revision: {{ .Release.Revision | quote }}
{{- if .Values.environment }}
environment: {{ .Values.environment | quote }}
{{- end }}
{{- if .Values.region }}
region: {{ .Values.region | quote }}
{{- end }}
{{- end }}

{{/*
Generate service monitor labels
*/}}
{{- define "clinic-app.serviceMonitorLabels" -}}
{{ include "clinic-app.labels" . }}
{{- if .Values.monitoring.serviceMonitor.enabled }}
monitoring: enabled
{{- end }}
{{- end }}

{{/*
Generate pod monitor labels
*/}}
{{- define "clinic-app.podMonitorLabels" -}}
{{ include "clinic-app.labels" . }}
{{- if .Values.monitoring.podMonitor.enabled }}
monitoring: enabled
{{- end }}
{{- end }}

{{/*
Generate backup annotations
*/}}
{{- define "clinic-app.backupAnnotations" -}}
{{- if .Values.backup.enabled }}
backup.kubernetes.io/enabled: "true"
backup.kubernetes.io/schedule: {{ .Values.backup.schedule | quote }}
backup.kubernetes.io/retention: {{ .Values.backup.retention | quote }}
{{- end }}
{{- end }}