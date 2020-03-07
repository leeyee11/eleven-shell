var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var VFS = (function () {
    function VFS() {
        this.root = new VFSFolder('~', null);
        this.pointer = this.root;
    }
    VFS.prototype.cd = function (path) {
        var names = path.split('/');
        var exist = true;
        var tempPointer = this.pointer;
        for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
            var name_1 = names_1[_i];
            if (names.indexOf(name_1) == 0 && name_1 == '~') {
                tempPointer = this.root;
            }
            else if (tempPointer.getChild(name_1) && tempPointer.getChild(name_1).type == "folder") {
                tempPointer = tempPointer.getChild(name_1);
            }
            else {
                exist = false;
                break;
            }
        }
        if (exist) {
            this.pointer = tempPointer;
            return { code: 0, message: '', result: null };
        }
        else {
            return { code: -1, message: 'error : no such a folder', result: null };
        }
    };
    VFS.prototype.mkdir = function (name) {
        var bin = 'mkdir';
        if (this.pointer.getChild(name)) {
            return { code: -1, message: bin + ": " + name + ": directory already exists", result: null };
        }
        else {
            this.pointer.addChild(name, new VFSFolder(name, this.pointer));
            return { code: 0, message: '', result: null };
        }
    };
    VFS.prototype.touch = function (name) {
        var bin = 'touch';
        if (this.pointer.getChild(name)) {
            return { code: -1, message: bin + ": " + name + ": file already exists", result: null };
        }
        else {
            this.pointer.addChild(name, new VFSFile(name, this.pointer));
            return { code: 0, message: '', result: null };
        }
    };
    VFS.prototype.write = function (str, target) {
        var bin = 'echo';
        if (this.pointer.getChild(target) == null) {
            this.touch(target);
        }
        else if (this.pointer.getChild(target).type === 'folder') {
            return { code: -1, message: bin + ": " + target + ": is a directory", result: null };
        }
        this.pointer.getChild(target).write(str);
        return { code: 0, message: '', result: null };
    };
    VFS.prototype.append = function (str, target) {
        var bin = 'echo';
        if (this.pointer.getChild(target) == null) {
            this.touch(target);
        }
        else if (this.pointer.getChild(target).type === 'folder') {
            return { code: -1, message: bin + ": " + target + ": is a directory", result: null };
        }
        this.pointer.getChild(target).append(str);
        return { code: 0, message: '', result: null };
    };
    VFS.prototype.ls = function () {
        var result = [];
        for (var _i = 0, _a = Object.keys(this.pointer.getChildren()); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            result.push(name_2);
        }
        return { code: 0, message: '', result: result };
    };
    VFS.prototype.cat = function (name) {
        var bin = 'cat';
        if (this.pointer.getChild(name)) {
            if (this.pointer.getChild(name).getType() === 'file') {
                var result = [];
                result.push(this.pointer.getChild(name).read());
                return { code: 0, message: "", result: result };
            }
            else {
                return { code: -1, message: bin + ": " + name + " is a directory", result: null };
            }
        }
        else {
            return { code: -1, message: bin + ": " + name + ": No such file or directory", result: null };
        }
    };
    VFS.prototype.getPath = function () {
        return this.pointer.getPath();
    };
    VFS.prototype.rm = function (name, flag) {
        var bin = 'rm';
        if (this.pointer.getChild(name)) {
            if (flag.indexOf('r') >= 0 || this.pointer.getChild(name).type === 'file') {
                this.pointer.removeChild(name);
                return { code: 0, message: '', result: null };
            }
            else if (this.pointer.getChild(name).type === 'folder') {
                return { code: -1, message: bin + ": " + name + ": is a directory", result: null };
            }
        }
        else {
            return { code: -1, message: bin + ": " + name + ": No such file or directory", result: null };
        }
    };
    return VFS;
}());
var VFSNode = (function () {
    function VFSNode(name, parent) {
        this.name = name;
        this.parent = parent;
        this.type = "node";
    }
    VFSNode.prototype.getName = function () {
        return this.name;
    };
    VFSNode.prototype.getType = function () {
        return this.type;
    };
    VFSNode.prototype.getPath = function () {
        if (this.getName() != '~') {
            return this.parent.getPath() + '/' + this.getName();
        }
        else {
            return this.getName();
        }
    };
    return VFSNode;
}());
var VFSFolder = (function (_super) {
    __extends(VFSFolder, _super);
    function VFSFolder(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        _this.type = "folder";
        _this.children = {};
        _this.children['.'] = _this;
        if (parent) {
            _this.children['..'] = _this.parent;
        }
        return _this;
    }
    VFSFolder.prototype.getChild = function (name) {
        return this.children[name];
    };
    VFSFolder.prototype.addChild = function (name, child) {
        this.children[name] = child;
    };
    VFSFolder.prototype.removeChild = function (name) {
        delete this.children[name];
    };
    VFSFolder.prototype.getChildren = function () {
        return this.children;
    };
    return VFSFolder;
}(VFSNode));
var VFSFile = (function (_super) {
    __extends(VFSFile, _super);
    function VFSFile(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        _this.type = "file";
        _this.content = "";
        return _this;
    }
    VFSFile.prototype.write = function (str) {
        this.content = str;
    };
    VFSFile.prototype.append = function (str) {
        this.content += str;
    };
    VFSFile.prototype.read = function () {
        return this.content;
    };
    return VFSFile;
}(VFSNode));
//# sourceMappingURL=vfs.js.map