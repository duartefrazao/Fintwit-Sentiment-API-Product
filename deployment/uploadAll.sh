#!/bin/bash
az storage blob upload --account-name apideployments --container-name templates --name apim.json --file deployment/apim.json 
az storage blob upload --account-name apideployments --container-name templates --name appservice.json --file deployment/appservice.json 
az storage blob upload --account-name apideployments --container-name templates --name main.parameters.json --file deployment/main.parameters.json 
az storage blob upload --account-name apideployments --container-name templates --name appservice.parameters.json --file deployment/appservice.parameters.json 
az storage blob upload --account-name apideployments --container-name templates --name apim.parameters.json --file deployment/apim.parameters.json 