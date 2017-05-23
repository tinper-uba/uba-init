const request = require('request');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const pathExists = require('path-exists');
const fs = require('fs');
const download = require('download-git-repo');
const spawn = require('cross-spawn');



function getHelp() {
  console.log(chalk.green(" Usage : "));
  console.log();
  console.log(chalk.green(" uba init"));
  console.log();
  process.exit(0);
}

function getVersion() {
  console.log(chalk.green(require("../package.json").version));
  process.exit(0);
}


module.exports = {
  plugin: function(options) {
    commands = options.cmd;
    pluginname = options.name;
    if (options.argv.h || options.argv.help) {
      getHelp();
    }
    if (options.argv.v || options.argv.version) {
      getVersion();
    }

    console.log(chalk.green("Available official templates:"));
    var repoNameData = [];
    request({
      url: 'https://api.github.com/users/uba-templates/repos',
      headers: {
        'User-Agent': 'uba'
      }
    }, function(err, res, body) {
      if (err) console.log(err);
      var requestBody = JSON.parse(body);
      if (Array.isArray(requestBody)) {
        requestBody.forEach(function(repo, index) {
          // console.log(
          //     (index + 1) + ')' + '  ' + chalk.yellow('★') +
          //     '  ' + chalk.blue(repo.name) +
          //     ' - ' + repo.description);
          repoNameData.push(`${repo.name} - ${repo.description}`);
        });
        //TODO 人机交互
        inquirer.prompt([{
          type: 'list',
          name: 'selectRepo',
          message: 'Please select :',
          choices: repoNameData
        }]).then(function(answers) {
          var selectName = answers.selectRepo.split(' - ')[0];
          var questions = [{
            type: 'input',
            name: 'selectName',
            message: 'boilerplate name :',
            default: function() {
              return 'uba-boilerplate';
            }
          }];
          inquirer.prompt(questions).then(function(answers) {
            var name = answers.selectName,
              template = selectName;
            var root = path.resolve(name);
            if (!pathExists.sync(name)) {
              fs.mkdirSync(root);
            } else {
              console.log(chalk.red(`directory ${name} already exists.`));
              process.exit(0);
            }
            console.log(chalk.red(`Downloading ${template} please wait.`));
            //TODO 开始下载
            download(`uba-templates/${template}`, `${name}`, function(err) {
              if (!err) {
                console.log(chalk.green(`Boilerplate ${name} done.`));
                inquirer.prompt([{
                  type: 'confirm',
                  message: 'Automatically install NPM dependent packages?',
                  name: 'ok'
                }]).then(function(res) {
                  var npmInstallChdir = path.resolve('.', name);
                  if (res.ok) {
                    console.log(chalk.green(`Install NPM dependent packages,please wait.`));
                    //TODO 选择自动安装
                    process.chdir(npmInstallChdir);
                    var args = ['install'].filter(function(e) {
                      return e;
                    });
                    var proc = spawn('npm', args, {
                      stdio: 'inherit'
                    });
                    proc.on('close', function(code) {
                      if (code !== 0) {
                        console.error('`npm ' + args.join(' ') + '` failed');
                        return;
                      }
                      console.log(chalk.green(`NPM package installed.`));
                    });

                  } else {
                    console.log(chalk.green(`Cancel the installation of NPM dependent package.\nPlease run \'cd ${name} && npm install\' manually.`));
                  }

                });
              } else {
                console.error(requestBody.message);
              }
            });
          });
        });
      }
    });

  }
}
