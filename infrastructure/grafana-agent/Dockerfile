FROM grafana/agent:latest
COPY agent.yaml /etc/agent/agent.yaml
CMD ["--config.file=/etc/agent/agent.yaml", "--config.expand-env"]
