# Install Build Tools

echo "Installing Build Tools "
echo ":: webpack babel-cli babel-loader babel-core babel-register"
Invoke-Expression "npm install webpack babel-loader babel-cli babel-core babel-register --save-dev"

# Install Babel

echo "Installing Babel Plugins & Presets"
echo ":: babel-preset-env babel-plugin-transform-class-properties"
Invoke-Expression "npm install babel-preset-env babel-plugin-transform-class-properties --save-dev"

# Install Libraries

echo "Installing Libraries"
echo ":: @beautiful-code/type-utils @beautiful-code/string-utils"
Invoke-Expression "npm install @beautiful-code/type-utils @beautiful-code/string-utils --save-dev"
