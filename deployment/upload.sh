#!/bin/bash
CONTAINER_NAME="templates-${1}"
echo $CONTAINER_NAME
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name apim.json --file deployment/apim.json --overwrite
az storage blob upload --account-name apideployments --container-name $CONTAINER_NAME --name appservice.json --file deployment/appservice.json --overwrite