#!bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd $DIR
echo "Executing npm to initiate time application within directory: $DIR/backend"
npm start --prefix "$DIR/backend"