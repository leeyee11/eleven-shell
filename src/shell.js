var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var Shell = (function () {
    function Shell(app) {
        this.node = document.createElement('code');
        app.appendChild(this.node);
        this.fs = new VFS();
        this.history = [];
        this.historyPointer = null;
        this.keywords = ['ls', 'cd', 'cat', 'echo', 'help', 'clear', 'touch', 'visit', 'mkdir', 'rm', 'render'];
        this.pages = ['music', 'markdown', 'lab', 'toys', 'ui', 'resume'];
        this.particles = new Particles(app);
    }
    Shell.prototype.renderCLI = function () {
        var shell = this;
        var prefix = shell.fs.getPath() + ' > ';
        var labels = __spreadArrays(shell.command.split(''), [' ']).map(function (char, i) {
            var span = document.createElement('span');
            span.innerHTML = char === ' ' ? '&nbsp' : char;
            if (i === shell.cursor) {
                span.style.background = "#acacac";
            }
            return span;
        });
        var preLabel = document.createElement('span');
        preLabel.innerText = prefix;
        shell.input.innerHTML = null;
        shell.input.appendChild(preLabel);
        labels.forEach(function (label) { return shell.input.append(label); });
    };
    Shell.prototype.newLine = function () {
        var shell = this;
        shell.enterLine = document.createElement('div');
        shell.enterLine.style.position = "relative";
        shell.input = document.createElement('div');
        shell.input.setAttribute("id", "input");
        shell.command = '';
        shell.cursor = 0;
        this.renderCLI();
        window.onkeydown = function (e) {
            if (e.key === 'Enter') {
                shell.history.push(shell.command);
                shell.historyPointer = shell.history.length;
                shell.exec(shell.command);
                shell.node.scrollTop = shell.node.scrollHeight;
                var prefix = shell.fs.getPath() + ' > ';
                shell.input.textContent = prefix;
            }
            else if (e.key === 'ArrowUp') {
                if (shell.historyPointer > 0) {
                    shell.command = shell.history[--shell.historyPointer];
                    shell.cursor = shell.command.length;
                }
            }
            else if (e.key === 'ArrowDown') {
                if (shell.historyPointer < shell.history.length - 1) {
                    shell.command = shell.history[++shell.historyPointer];
                }
                else {
                    shell.historyPointer = shell.history.length;
                    shell.command = '';
                }
                shell.cursor = shell.command.length;
            }
            else if (e.key === 'Tab') {
                e.preventDefault();
                var _a = shell.parse(shell.command), bin = _a[0], args = _a.slice(1);
                if (args.length === 0) {
                    for (var _i = 0, _b = shell.keywords; _i < _b.length; _i++) {
                        var kw = _b[_i];
                        if (kw.indexOf(bin) >= 0) {
                            shell.command = kw + ' ';
                            shell.cursor = shell.command.length;
                            break;
                        }
                    }
                }
                else if (args.length > 0) {
                    var handler = shell.fs.ls();
                    if (handler.code === 0) {
                        var list = handler.result;
                        for (var _c = 0, list_1 = list; _c < list_1.length; _c++) {
                            var i = list_1[_c];
                            if (i.indexOf(args[args.length - 1]) >= 0) {
                                var command = shell.command
                                    .slice(0, shell.command.length - args[args.length - 1].length);
                                shell.command = command + i;
                                shell.cursor = shell.command.length;
                                break;
                            }
                        }
                    }
                }
            }
            else if (/^[a-zA-Z0-9\s\_\-\=\\\+\/\`\~\!\@\#\$\%\^\&\*\(\)\,\.\{\}\"\'\<\>\?\:\\t]{1}$/g.test(e.key)) {
                var oldStr = shell.command;
                shell.command = oldStr.slice(0, shell.cursor) + e.key + oldStr.slice(shell.cursor);
                var prefix = shell.fs.getPath() + ' > ';
                shell.input.innerText = prefix + shell.command;
                shell.cursor++;
            }
            else if (e.key === 'ArrowLeft') {
                if (shell.cursor > 0) {
                    shell.cursor--;
                }
            }
            else if (e.key === 'ArrowRight') {
                if (shell.cursor < shell.command.length) {
                    shell.cursor++;
                }
            }
            else if (e.key === 'Backspace') {
                if (shell.cursor > 0) {
                    var oldStr = shell.command;
                    shell.command = oldStr.slice(0, shell.cursor - 1) + oldStr.slice(shell.cursor);
                    shell.cursor--;
                }
            }
            shell.renderCLI();
        };
        shell.enterLine.appendChild(shell.input);
        shell.node.appendChild(shell.enterLine);
    };
    Shell.prototype.ls = function (path) {
        if (path && path[0] === "/") {
            this.error("ls: /: No such file or directory");
            return;
        }
        var dir = !path
            ? '.'
            : path && path[path.length - 1] === "/"
                ? path.slice(0, path.length - 1)
                : path;
        if (dir) {
            var workDir = this.fs.getPath();
            var handler = this.fs.cd(dir);
            if (handler.code === 0) {
                var list = this.fs.ls().result;
                var str = "";
                for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
                    var i = list_2[_i];
                    str += i + " ";
                }
                this.echo(str);
                this.fs.cd(workDir);
            }
            else {
                this.error(handler.message);
            }
        }
        else {
            var list = this.fs.ls().result;
            var str = "";
            for (var _a = 0, list_3 = list; _a < list_3.length; _a++) {
                var i = list_3[_a];
                str += i + " ";
            }
            this.echo(str);
        }
    };
    Shell.prototype.cd = function (path) {
        var dir = !path
            ? '~'
            : path[path.length - 1] === "/"
                ? path.slice(0, path.length - 1)
                : path;
        var handler = this.fs.cd(dir);
        if (handler.code < 0) {
            this.error(handler.message);
        }
    };
    Shell.prototype.pwd = function () {
        this.echo(this.fs.getPath());
    };
    Shell.prototype.help = function () {
        var _this = this;
        var helpList = [
            'render\t[file]',
            'echo\t[arg...]',
            'touch\t[file]',
            'cat\t[file]',
            'cd\t[dir]',
            'clear\t',
            'help\t',
            'pwd\t',
            'ls\t'
        ];
        helpList.forEach(function (line) { return _this.echo(line); });
    };
    Shell.prototype.cat = function (target) {
        var workDir = this.fs.getPath();
        var pathes = target.split('/');
        if (!pathes[pathes.length - 1]) {
            this.error('illegal filename');
            return;
        }
        var index = 0;
        var content;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.cat(path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            content = handler.result;
            index++;
        }
        this.fs.cd(workDir);
        this.echo(content[0]);
    };
    Shell.prototype.touch = function (fileName) {
        if (fileName && fileName[0] === "/") {
            this.error("touch: /: No such file or directory");
            return;
        }
        var workDir = this.fs.getPath();
        var pathes = fileName.split('/');
        if (!pathes[pathes.length - 1]) {
            this.error('illegal filename');
            return;
        }
        var index = 0;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.touch(path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            index++;
        }
        this.fs.cd(workDir);
    };
    Shell.prototype.rm = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var flag = args
            .filter(function (arg) { return arg.indexOf('-') === 0; })
            .map(function (arg) { return arg.replace('-', ''); })
            .join('');
        var targetName = args[args.length - 1];
        if (targetName && targetName[0] === "/") {
            this.error("rm: /: No such file or directory");
            return;
        }
        var workDir = this.fs.getPath();
        var pathes = targetName.split('/');
        var index = 0;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.rm(path, flag);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            index++;
        }
        this.fs.cd(workDir);
    };
    Shell.prototype.mkdir = function (target) {
        var workDir = this.fs.getPath();
        var pathes = target.split('/').filter(function (c) { return !!c; });
        var index = 0;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.mkdir(path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            index++;
        }
        this.fs.cd(workDir);
    };
    Shell.prototype.clear = function () {
        this.node.innerHTML = "";
        this.newLine();
    };
    Shell.prototype.print = function (str) {
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
    Shell.prototype.echo = function (rawStr, op, target) {
        var str = rawStr.replace("\"", '').replace("'", '');
        if (op && op === '>>') {
            this.append(str, target);
        }
        else if (op && op === '>') {
            this.write(str, target);
        }
        else {
            this.print(str);
        }
    };
    Shell.prototype.write = function (str, target) {
        if (target && target[0] === "/") {
            this.error("write: /: No such file or directory");
            return;
        }
        var workDir = this.fs.getPath();
        var pathes = target.split('/');
        if (!pathes[pathes.length - 1]) {
            this.error('illegal filename');
            return;
        }
        var index = 0;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.write(str, path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            index++;
        }
        this.fs.cd(workDir);
    };
    Shell.prototype.append = function (str, target) {
        if (target && target[0] === "/") {
            this.error("append: /: No such file or directory");
            return;
        }
        var workDir = this.fs.getPath();
        var pathes = target.split('/');
        if (!pathes[pathes.length - 1]) {
            this.error('illegal filename');
            return;
        }
        var index = 0;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.append(str, path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            index++;
        }
        this.fs.cd(workDir);
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
    Shell.prototype.render = function (target) {
        var workDir = this.fs.getPath();
        var pathes = target.split('/');
        if (!pathes[pathes.length - 1]) {
            this.error('illegal filename');
            return;
        }
        var index = 0;
        var content;
        while (index < pathes.length) {
            var path = pathes[index];
            var handler = index < pathes.length - 1
                ? this.fs.cd(path)
                : this.fs.cat(path);
            if (handler.code < 0) {
                this.error(handler.message);
                this.fs.cd(workDir);
                return;
            }
            content = handler.result;
            index++;
        }
        this.fs.cd(workDir);
        this.particles.setText(content[0]);
        this.particles.render();
    };
    Shell.prototype.parse = function (command) {
        var inStr = false;
        return command.split('')
            .reduce(function (words, c) {
            if (c === '"') {
                inStr = !inStr;
            }
            else if (c === ' ' && !inStr) {
                if (words[words.length] !== '') {
                    words = __spreadArrays(words, ['']);
                }
            }
            else {
                words[words.length - 1] += c;
            }
            return words;
        }, ['']);
    };
    Shell.prototype.exec = function (command) {
        var shell = this;
        var prefix = shell.fs.getPath() + ' > ';
        shell.print(prefix + command);
        var words = shell.parse(command);
        var bin = words[0], args = words.slice(1);
        if (!bin) {
        }
        else if (typeof shell[bin] === 'function') {
            shell[bin].apply(shell, args);
        }
        else {
            shell.echo('v-shell : command not found.');
        }
        prefix = shell.fs.getPath() + ' > ';
        shell.command = '';
        shell.cursor = 0;
    };
    return Shell;
}());
//# sourceMappingURL=shell.js.map