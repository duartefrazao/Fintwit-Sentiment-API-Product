#!/bin/bash
sh deployment/uploadAll.sh
az deployment group create --template-file main.json --resource-group api  --name deploy --parameters main.parameters.json