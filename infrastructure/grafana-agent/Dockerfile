FROM grafana/agent:latest

COPY agent.yaml /etc/agent/agent.yaml

# Listen on all interfaces so Render health checks can reach the agent.
EXPOSE 12345
CMD ["--config.file=/etc/agent/agent.yaml", "--config.expand-env", "--server.http.address=0.0.0.0:12345"]
