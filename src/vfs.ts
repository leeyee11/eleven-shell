interface VFSResponse {
	code: number,
	message: string,
	result: Array<string>
}

class VFS {
	private root: VFSFolder
	private pointer: VFSFolder
	public constructor() {
		this.root = new VFSFolder('~', null)
		this.pointer = this.root
	}
	public cd(path: string): VFSResponse {
		let names: Array<string> = path.split('/')
		let exist: boolean = true
		let tempPointer: VFSFolder = this.pointer
		for (let name of names) {
			if (names.indexOf(name) == 0 && name == '~') {
				tempPointer = this.root
			} else if (tempPointer.getChild(name) && tempPointer.getChild(name).type == "folder") {
				tempPointer = tempPointer.getChild(name)
			} else {
				exist = false
				break
			}
		}
		if (exist) {
			this.pointer = tempPointer
			return { code: 0, message: '', result: null }
		} else {
			return { code: -1, message: 'error : no such a folder', result: null }
		}
	}
	public mkdir(name: string): VFSResponse {
		const bin ='mkdir'
		if (this.pointer.getChild(name)) {
			return { code: -1, message: `${bin}: ${name}: directory already exists`, result: null }
		} else {
			this.pointer.addChild(name, new VFSFolder(name, this.pointer))
			return { code: 0, message: '', result: null }
		}
	}
	public touch(name: string): VFSResponse {
		const bin = 'touch'
		if (this.pointer.getChild(name)) {
			return { code: -1, message: `${bin}: ${name}: file already exists`, result: null }
		} else {
			this.pointer.addChild(name, new VFSFile(name, this.pointer))
			return { code: 0, message: '', result: null }
		}
	}
	public write(str: string, target: string): VFSResponse {
		const bin = 'echo'
		if (this.pointer.getChild(target) == null) {
			this.touch(target)
		}else if (this.pointer.getChild(target).type === 'folder'){
			return { code: -1, message: `${bin}: ${target}: is a directory`, result: null }
		}
		this.pointer.getChild(target).write(str)
		return { code: 0, message: '', result: null }
	}
	public append(str: string, target: string): VFSResponse {
		const bin = 'echo'
		if (this.pointer.getChild(target) == null) {
			this.touch(target)
		}else if (this.pointer.getChild(target).type === 'folder'){
			return { code: -1, message: `${bin}: ${target}: is a directory`, result: null }
		}
		this.pointer.getChild(target).append(str)
		return { code: 0, message: '', result: null }
	}
	public ls(): VFSResponse {
		let result: Array<string> = []
		for (let name of Object.keys(this.pointer.getChildren())) {
			result.push(name)
		}
		return { code: 0, message: '', result: result }
	}
	public cat(name: string): VFSResponse {
		const bin = 'cat'
		if (this.pointer.getChild(name)) {
			if (this.pointer.getChild(name).getType() === 'file') {
				let result: Array<string> = []
				result.push(this.pointer.getChild(name).read())
				return { code: 0, message: "", result: result }
			} else {
				return { code: -1, message:`${bin}: ${name} is a directory`, result: null }
			}
		} else {
			return { code: -1, message: `${bin}: ${name}: No such file or directory`, result: null }
		}
	}
	public getPath() {
		return this.pointer.getPath()
	}
	public rm(name: string, flag: string): VFSResponse {
		const bin = 'rm'
		if (this.pointer.getChild(name)) {
			if (flag.indexOf('r') >= 0 || this.pointer.getChild(name).type === 'file') {
				this.pointer.removeChild(name)
				return { code: 0, message: '', result: null }
			} else if (this.pointer.getChild(name).type === 'folder') {
				return { code: -1, message: `${bin}: ${name}: is a directory`, result: null }
			}
		} else {
			return { code: -1, message: `${bin}: ${name}: No such file or directory`, result: null }
		}
	}
}

class VFSNode {
	protected name: string
	protected type: string
	protected parent: VFSNode
	// protected children?:Object
	public constructor(name: string, parent: VFSNode) {
		this.name = name
		this.parent = parent
		this.type = "node"
	}
	public getName(): string {
		return this.name
	}
	public getType(): string {
		return this.type
	}
	public getPath(): string {
		if (this.getName() != '~') {
			return this.parent.getPath() + '/' + this.getName()
		} else {
			return this.getName()
		}
	}
}


class VFSFolder extends VFSNode {
	private children: any
	public constructor(name: string, parent: VFSFolder) {
		super(name, parent)
		this.type = "folder"
		this.children = {}
		this.children['.'] = this
		if (parent) {
			this.children['..'] = this.parent
		}
	}
	public getChild(name: string): any {
		return this.children[name]
	}
	public addChild(name: string, child: any): void {
		this.children[name] = child
	}
	public removeChild(name: string): void {
		delete this.children[name]
	}
	public getChildren(): any {
		return this.children
	}
}
class VFSFile extends VFSNode {
	private content: string
	public constructor(name: string, parent: VFSFolder) {
		super(name, parent)
		this.type = "file"
		this.content = ""
	}
	public write(str: string): void {
		this.content = str
	}
	public append(str: string): void {
		this.content += str
	}
	public read(): string {
		return this.content
	}
}

// export default VFS