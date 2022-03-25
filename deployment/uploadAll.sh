#!/bin/bash
CONTAINER_NAME="templates-$1"
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name apim.json --file deployment/apim.json 
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name appservice.json --file deployment/appservice.json 
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name main.parameters.json --file deployment/main.parameters.json 
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name appservice.parameters.json --file deployment/appservice.parameters.json 
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name apim.parameters.json --file deployment/apim.parameters.json 
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name .env --file app/.env 