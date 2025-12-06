FROM grafana/agent:latest
COPY agent.yaml /etc/agent/agent.yaml
ENTRYPOINT ["/bin/agent"]
CMD ["--config.file=/etc/agent/agent.yaml", "--config.expand-env"]