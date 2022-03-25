#!/bin/bash
az storage blob upload --account-name apideployments --container-name templates --name apim.json --file deployment/apim.json 
az storage blob upload --account-name apideployments --container-name templates --name appservice.json --file deployment/appservice.json 