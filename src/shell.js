var Shell = (function () {
    function Shell(app) {
        this.node = document.createElement('code');
        app.appendChild(this.node);
        this.fs = new VFS();
        this.history = [];
        this.historyPointer = null;
        this.keywords = ['ls', 'cd', 'cat', 'echo', 'help', 'clear', 'touch', 'render', 'visit'];
        this.pages = ['music', 'markdown', 'lab', 'toys', 'ui', 'resume'];
        this.particles = new Particles(app);
    }
    Shell.prototype.newLine = function () {
        var shell = this;
        shell.enterLine = document.createElement('div');
        shell.enterLine.style.position = "relative";
        shell.enterLine.label = document.createElement('label');
        shell.enterLine.label.innerHTML = shell.fs.getPath() + ' > ';
        shell.enterLine.label.style.position = "absolute";
        shell.enterLine.input = document.createElement('input');
        shell.enterLine.input.spellcheck = false;
        shell.enterLine.input.value = "";
        shell.enterLine.input.style.paddingLeft = (shell.fs.getPath() + ' > ').length * 9.6 + "px";
        shell.enterLine.input.onkeydown = function (e) {
            if (e.key == 'Enter') {
                shell.history.push(shell.enterLine.input.value);
                shell.historyPointer = shell.history.length;
                shell.exec(shell.enterLine.input.value);
                shell.node.scrollTop = shell.node.scrollHeight;
                shell.enterLine.input.value = "";
                shell.enterLine.label.innerHTML = shell.fs.getPath() + ' > ';
                shell.enterLine.input.style.paddingLeft = (shell.fs.getPath() + ' > ').length * 9.6 + "px";
            }
            else if (e.key == 'ArrowUp') {
                if (shell.historyPointer > 0) {
                    shell.enterLine.input.value = shell.history[--shell.historyPointer];
                }
            }
            else if (e.key == 'ArrowDown') {
                if (shell.historyPointer < shell.history.length - 1) {
                    shell.enterLine.input.value = shell.history[++shell.historyPointer];
                }
                else {
                    if (shell.historyPointer < shell.history.length) {
                        ++shell.historyPointer;
                    }
                    shell.enterLine.input.value = "";
                }
            }
            else if (e.key == 'Tab') {
                e.preventDefault();
                if (shell.enterLine.input.value.split(' ').length == 1) {
                    for (var _i = 0, _a = shell.keywords; _i < _a.length; _i++) {
                        var kw = _a[_i];
                        if (kw.indexOf(shell.enterLine.input.value) >= 0) {
                            shell.enterLine.input.value = kw;
                            break;
                        }
                    }
                }
                else if (shell.enterLine.input.value.split(' ').length == 2 && shell.enterLine.input.value.split(' ')[0] == 'visit') {
                    for (var _b = 0, _c = shell.pages; _b < _c.length; _b++) {
                        var p = _c[_b];
                        if (p.indexOf(shell.enterLine.input.value.split(' ')[1]) >= 0) {
                            shell.enterLine.input.value = "visit " + p;
                            break;
                        }
                    }
                }
                else if (shell.enterLine.input.value.split(' ').length > 1) {
                    var handler = shell.fs.ls();
                    if (handler.code == 0) {
                        var list = handler.message;
                        for (var _d = 0, list_1 = list; _d < list_1.length; _d++) {
                            var i = list_1[_d];
                            var words = shell.enterLine.input.value.split(' ');
                            if (i.indexOf(words[words.length - 1]) >= 0) {
                                var command = shell.enterLine.input.value.slice(0, shell.enterLine.input.value.length - words[words.length - 1].length);
                                shell.enterLine.input.value = command + i;
                                break;
                            }
                        }
                    }
                }
            }
        };
        shell.enterLine.input.oninput = function (e) {
            if (shell.enterLine.input.value.length >= 50) {
                shell.enterLine.input.value = shell.enterLine.input.value.slice(0, 50);
            }
        };
        shell.enterLine.appendChild(shell.enterLine.label);
        shell.enterLine.appendChild(shell.enterLine.input);
        shell.node.appendChild(shell.enterLine);
        shell.enterLine.input.focus();
    };
    Shell.prototype.ls = function (path) {
        var dir;
        if (path && path == "/") {
            this.error("permission denied");
            return;
        }
        if (path && path[path.length - 1] == "/") {
            dir = path.slice(0, path.length - 1);
        }
        else {
            dir = path;
        }
        if (dir) {
            var currentDir = this.fs.getPath();
            var handler = this.fs.cd(dir);
            console.log("ls", dir);
            if (handler.code == 0) {
                var list = this.fs.ls().result;
                var str = "";
                for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
                    var i = list_2[_i];
                    str += i + " ";
                }
                this.echo(str);
                this.fs.cd(currentDir);
            }
            else {
                this.error(handler.message);
            }
        }
        else {
            var list = this.fs.ls().message;
            var str = "";
            for (var _a = 0, list_3 = list; _a < list_3.length; _a++) {
                var i = list_3[_a];
                str += i + " ";
            }
            this.echo(str);
        }
    };
    Shell.prototype.cd = function (path) {
        if (!path) {
            path = '~';
        }
        if (path[path.length - 1] == "/") {
            path.slice(0, path.length - 1);
        }
        var handler = this.fs.cd(path);
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.pwd = function () {
        this.echo(this.fs.getPath());
    };
    Shell.prototype.help = function () {
        this.echo('visit\t[home|music|markdown|lab|toys|ui|resume]');
        this.echo('render\t[file]');
        this.echo('echo\t[arg...]');
        this.echo('touch\t[file]');
        this.echo('cat\t[file]');
        this.echo('cd\t[dir]');
        this.echo('clear\t');
        this.echo('help\t');
        this.echo('pwd\t');
        this.echo('ls\t');
    };
    Shell.prototype.cat = function (path) {
        var handler;
        if (path.lastIndexOf('/') == -1) {
            var fileName = path;
            handler = this.fs.cat(fileName);
        }
        else {
            var fileName = path.slice(path.lastIndexOf('/') + 1, path.length);
            var dir = path.slice(0, path.lastIndexOf('/'));
            var currentDir = this.fs.getPath();
            if (dir) {
                this.fs.cd(dir);
            }
            handler = this.fs.cat(fileName);
            if (dir) {
                this.fs.cd(currentDir);
            }
        }
        if (handler.code == 0) {
            this.echo(handler.result[0]);
        }
        else if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.touch = function (fileName) {
        var handler = this.fs.touch(fileName);
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.mkdir = function (path) {
        var handler;
        if (path == "/") {
            this.error("/: is a folder");
            return;
        }
        if (path[path.length - 1] == "/") {
            path.slice(0, path.length - 1);
        }
        if (path.lastIndexOf('/') == -1) {
            var folderName = path;
            handler = this.fs.mkdir(folderName);
        }
        else {
            var folderName = path.slice(path.lastIndexOf('/') + 1, path.length);
            var dir = path.slice(0, path.lastIndexOf('/'));
            var currentDir = this.fs.getPath();
            if (dir) {
                this.fs.cd(dir);
            }
            handler = this.fs.mkdir(folderName);
            if (dir) {
                this.fs.cd(currentDir);
            }
        }
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.clear = function () {
        this.node.innerHTML = "";
        this.newLine();
    };
    Shell.prototype.echo = function (str) {
        var line = document.createElement('div');
        if (str) {
            var words = str.split(' ');
            for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
                var word = words_1[_i];
                var node = document.createElement('span');
                node.innerHTML = word;
                var space = document.createElement('span');
                space.innerHTML = ' ';
                line.appendChild(node);
                line.appendChild(space);
            }
        }
        this.node.insertBefore(line, this.enterLine);
    };
    Shell.prototype.write = function (str, target) {
        var handler = this.fs.write(str, target);
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.append = function (str, target) {
        var handler = this.fs.append(str, target);
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.visit = function (page) {
        if (this.pages.indexOf(page) >= 0) {
            var host = document.domain.split('.');
            window.location.href = 'http://' + page + '.' + host[1] + '.' + host[2];
        }
        else {
            this.error('no such page');
        }
    };
    Shell.prototype.error = function (err) {
        this.echo(err);
    };
    Shell.prototype.render = function (path) {
        var handler;
        if (path.lastIndexOf('/') == -1) {
            var fileName = path;
            handler = this.fs.cat(fileName);
        }
        else {
            var fileName = path.slice(path.lastIndexOf('/') + 1, path.length);
            var dir = path.slice(0, path.lastIndexOf('/'));
            var currentDir = this.fs.getPath();
            if (dir) {
                this.fs.cd(dir);
            }
            handler = this.fs.cat(fileName);
            if (dir) {
                this.fs.cd(currentDir);
            }
        }
        if (handler.code == 0) {
            this.particles.setText(handler.result[0]);
            this.particles.render();
        }
        else if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.exec = function (command) {
        command.replace(/\s*/g, ' ');
        this.label = this.fs.getPath() + ' > ';
        this.echo(this.label + command);
        var words = command.split(' ');
        switch (words[0]) {
            case '':
                break;
            case 'ls':
                this.ls(words[1]);
                break;
            case 'cd':
                this.cd(words[1]);
                break;
            case 'pwd':
                this.pwd();
                break;
            case 'help':
                this.help();
                break;
            case 'touch':
                this.touch(words[1]);
                break;
            case 'mkdir':
                this.mkdir(words[1]);
                break;
            case 'echo':
                if (command.replace(/\".*\"/g, '').indexOf('>>') > 0) {
                    var target = command.replace(/\".*\"/g, '').split('>>')[1].replace(/\s/g, '');
                    var str = command.split('"')[1];
                    this.append(str, target);
                }
                else if (command.replace(/\".*\"/g, '').indexOf('>') > 0) {
                    var target = command.replace(/\".*\"/g, '').split('>')[1].replace(/\s/g, '');
                    var str = command.split('"')[1];
                    this.write(str, target);
                }
                else {
                    var str = command.split('"')[1];
                    this.echo(str);
                }
                break;
            case 'clear':
                this.clear();
                break;
            case 'render':
                this.render(words[1]);
                break;
            case 'cat':
                this.cat(words[1]);
                break;
            case 'visit':
                this.visit(words[1]);
                break;
            default:
                this.error('bash : command not found ' + words[0]);
                break;
        }
    };
    return Shell;
}());
//# sourceMappingURL=shell.js.map