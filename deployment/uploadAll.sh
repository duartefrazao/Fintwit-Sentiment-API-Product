#!/bin/bash
CONTAINER_NAME="templates-$1"
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name apim.json --file deployment/apim.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name appservice.json --file deployment/appservice.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name main.parameters.json --file deployment/main.parameters.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name appservice.parameters.json --file deployment/appservice.parameters.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name apim.parameters.json --file deployment/apim.parameters.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name .env --file app/.env --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name sentiment.json --file api-management/api/sentiment.json --overwrite