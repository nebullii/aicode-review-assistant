#!/bin/bash

# Health Check Script for All Services
# Monitors the health of all microservices

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service endpoints
API_SERVICE="${API_SERVICE_URL:-http://localhost:3000}"
GITHUB_SERVICE="${GITHUB_SERVICE_URL:-http://localhost:3002}"
ANALYSIS_SERVICE="${ANALYSIS_SERVICE_URL:-http://localhost:8001}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Health Check - AI Code Review Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check service health
check_service() {
    local service_name=$1
    local service_url=$2
    local health_endpoint="${service_url}/health"

    echo -n "Checking ${service_name}... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "${health_endpoint}" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ Healthy${NC} (${service_url})"
        return 0
    elif [ "$response" == "000" ]; then
        echo -e "${RED}✗ Unreachable${NC} (${service_url})"
        return 1
    else
        echo -e "${YELLOW}⚠ Status ${response}${NC} (${service_url})"
        return 1
    fi
}

# Check all services
total=0
healthy=0

echo -e "${YELLOW}Checking services...${NC}\n"

if check_service "API Service     " "$API_SERVICE"; then
    ((healthy++))
fi
((total++))

if check_service "GitHub Service  " "$GITHUB_SERVICE"; then
    ((healthy++))
fi
((total++))

if check_service "Analysis Service" "$ANALYSIS_SERVICE"; then
    ((healthy++))
fi
((total++))

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Services: ${total}"
echo -e "Healthy: ${GREEN}${healthy}${NC}"
echo -e "Unhealthy: ${RED}$((total - healthy))${NC}"

if [ $healthy -eq $total ]; then
    echo -e "\n${GREEN}✓ All services are healthy${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some services are unhealthy${NC}"
    exit 1
fi
