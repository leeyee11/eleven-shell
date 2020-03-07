/**
 * @param code -1 -> error 0 -> success
 * @param message error message or request result
 * @param result response body
 */
interface VFSResponse {
	code: number,
	message: string,
	result: Array<string>
}

class Shell {
	//base property
	private node: HTMLElement
	private fs: VFS
	private history: Array<string>
	private historyPointer: number
	private keywords: Array<string>
	private pages: Array<string>
	private particles: Particles
	private input: HTMLDivElement
	private cursor: number
	private command: string
	//widget
	private enterLine: HTMLElement//based on HTMLElement


	constructor(app: HTMLElement) {
		this.node = document.createElement('code')
		app.appendChild(this.node)
		this.fs = new VFS()
		this.history = []
		this.historyPointer = null
		this.keywords = ['ls', 'cd', 'cat', 'echo', 'help', 'clear', 'touch', 'visit', 'mkdir', 'rm', 'render']
		this.pages = ['music', 'markdown', 'lab', 'toys', 'ui', 'resume']
		this.particles = new Particles(app)
	}
	private renderCLI(): void {
		const shell: Shell = this
		const prefix: string = shell.fs.getPath() + ' > '
		const labels: HTMLSpanElement[] = [...shell.command.split(''), ' ']
			.map((char, i) => {
				const span = document.createElement('span')
				span.innerHTML = char === ' ' ? '&nbsp' : char
				if (i === shell.cursor) {
					span.style.background = "#acacac"
				}
				return span
			})
		const preLabel: HTMLSpanElement = document.createElement('span')
		preLabel.innerText = prefix
		shell.input.innerHTML = null
		shell.input.appendChild(preLabel)
		labels.forEach(label => shell.input.append(label))
	}

	newLine(): void {
		const shell: Shell = this

		shell.enterLine = document.createElement('div')
		shell.enterLine.style.position = "relative"

		shell.input = document.createElement('div')
		shell.input.setAttribute("id", "input")

		shell.command = ''
		shell.cursor = 0

		this.renderCLI()

		window.onkeydown = function (e: KeyboardEvent) {
			if (e.key === 'Enter') {
				shell.history.push(shell.command)
				shell.historyPointer = shell.history.length
				shell.exec(shell.command)
				shell.node.scrollTop = shell.node.scrollHeight
				const prefix: string = shell.fs.getPath() + ' > '
				shell.input.textContent = prefix

			} else if (e.key === 'ArrowUp') {
				if (shell.historyPointer > 0) {
					shell.command = shell.history[--shell.historyPointer]
					shell.cursor = shell.command.length
				}
			} else if (e.key === 'ArrowDown') {
				if (shell.historyPointer < shell.history.length - 1) {
					shell.command = shell.history[++shell.historyPointer]
				} else {
					shell.historyPointer = shell.history.length
					shell.command = ''
				}
				shell.cursor = shell.command.length

			} else if (e.key === 'Tab') {
				e.preventDefault()
				const [bin, ...args]: string[] = shell.parse(shell.command)
				if (args.length === 0) {
					for (let kw of shell.keywords) {
						if (kw.indexOf(bin) >= 0) {
							shell.command = kw + ' '
							shell.cursor = shell.command.length
							break
						}
					}
				} else if (args.length > 0) {
					const handler: VFSResponse = shell.fs.ls()
					if (handler.code === 0) {
						const list: string[] = handler.result
						for (let i of list) {
							if (i.indexOf(args[args.length - 1]) >= 0) {
								const command: string = shell.command
									.slice(0, shell.command.length - args[args.length - 1].length)
								shell.command = command + i
								shell.cursor = shell.command.length
								break
							}
						}
					}
				}
			} else if (/^[a-zA-Z0-9\s\_\-\=\\\+\/\`\~\!\@\#\$\%\^\&\*\(\)\,\.\{\}\"\'\<\>\?\:\\t]{1}$/g.test(e.key)) {
				const oldStr: string = shell.command
				shell.command = oldStr.slice(0, shell.cursor) + e.key + oldStr.slice(shell.cursor)
				const prefix: string = shell.fs.getPath() + ' > '
				shell.input.innerText = prefix + shell.command
				shell.cursor++
			} else if (e.key === 'ArrowLeft') {
				if (shell.cursor > 0) {
					shell.cursor--
				}
			} else if (e.key === 'ArrowRight') {
				if (shell.cursor < shell.command.length) {
					shell.cursor++
				}
			} else if (e.key === 'Backspace') {
				if (shell.cursor > 0) {
					const oldStr: string = shell.command
					shell.command = oldStr.slice(0, shell.cursor - 1) + oldStr.slice(shell.cursor)
					shell.cursor--
				}
			}
			shell.renderCLI()
		}
		shell.enterLine.appendChild(shell.input)
		shell.node.appendChild(shell.enterLine)
	}
	ls(path: string): void {
		if (path && path[0] === "/") {
			this.error("ls: /: No such file or directory")
			return
		}

		const dir: string = !path
			? '.'
			: path && path[path.length - 1] === "/"
				? path.slice(0, path.length - 1)
				: path

		if (dir) {
			//store workDir
			const workDir = this.fs.getPath()
			//cd target dir
			const handler: VFSResponse = this.fs.cd(dir)
			if (handler.code === 0) {
				const list = this.fs.ls().result
				let str = ""
				for (let i of list) {
					str += i + " "
				}
				this.echo(str)
				//restore workDir without check
				this.fs.cd(workDir)
			} else {
				this.error(handler.message)
			}
		} else {
			const list = this.fs.ls().result
			let str = ""
			for (let i of list) {
				str += i + " "
			}
			this.echo(str)
		}

	}
	cd(path: string): void {
		const dir = !path
			? '~'
			: path[path.length - 1] === "/"
				? path.slice(0, path.length - 1)
				: path

		const handler: VFSResponse = this.fs.cd(dir)
		if (handler.code < 0) {
			this.error(handler.message)
		}
	}
	pwd(): void {
		this.echo(this.fs.getPath())
	}
	help(): void {
		const helpList = [
			// 'visit\t[home|music|markdown|lab|toys|ui|resume]',
			'render\t[file]',
			'echo\t[arg...]',
			'touch\t[file]',
			'cat\t[file]',
			'cd\t[dir]',
			'clear\t',
			'help\t',
			'pwd\t',
			'ls\t'
		]
		helpList.forEach(line => this.echo(line))
	}

	cat(target: string): void {
		const workDir = this.fs.getPath()
		const pathes = target.split('/')
		if (!pathes[pathes.length - 1]) {
			this.error('illegal filename')
			return
		}
		let index = 0
		let content: string[];
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.cat(path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			content = handler.result;
			index++
		}
		this.fs.cd(workDir);
		this.echo(content[0]);
	}
	touch(fileName: string): void {
		if (fileName && fileName[0] === "/") {
			this.error("touch: /: No such file or directory")
			return
		}
		const workDir = this.fs.getPath()
		const pathes = fileName.split('/')

		if (!pathes[pathes.length - 1]) {
			this.error('illegal filename')
			return
		}
		let index = 0
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.touch(path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			index++
		}
		this.fs.cd(workDir)
	}
	rm(...args: string[]): void {
		const flag = args
			.filter(arg => arg.indexOf('-') === 0)
			.map(arg => arg.replace('-', ''))
			.join('')
		const targetName = args[args.length - 1]
		if (targetName && targetName[0] === "/") {
			this.error("rm: /: No such file or directory")
			return
		}

		const workDir = this.fs.getPath()
		const pathes = targetName.split('/')
		let index = 0
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.rm(path, flag)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			index++
		}
		this.fs.cd(workDir)
	}
	mkdir(target: string): void {
		const workDir = this.fs.getPath()
		const pathes = target.split('/').filter(c => !!c)
		let index = 0
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.mkdir(path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			index++
		}
		this.fs.cd(workDir)
	}
	clear(): void {
		this.node.innerHTML = ""
		this.newLine()
	}
	private print(str: string) {
		const line = document.createElement('div')
		if (str) {
			const words = str.split(' ')
			for (const word of words) {
				const node = document.createElement('span')
				node.innerHTML = word
				const space = document.createElement('span')
				space.innerHTML = ' '
				line.appendChild(node)
				line.appendChild(space)
			}
		}
		this.node.insertBefore(line, this.enterLine)
	}
	echo(rawStr: string, op?: string, target?: string): void {
		const str = rawStr.replace(`"`, '').replace(`'`, '')
			
		if (op && op === '>>') {
			this.append(str, target)
		} else if (op && op === '>') {
			this.write(str, target)
		} else {
			this.print(str)
		}
	}
	write(str: string, target: string): void {
		if (target && target[0] === "/") {
			this.error("write: /: No such file or directory")
			return
		}
		const workDir = this.fs.getPath()
		const pathes = target.split('/')
		if (!pathes[pathes.length - 1]) {
			this.error('illegal filename')
			return
		}
		let index = 0
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.write(str, path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			index++
		}
		this.fs.cd(workDir)
	}
	append(str: string, target: string): void {
		if (target && target[0] === "/") {
			this.error("append: /: No such file or directory")
			return
		}
		const workDir = this.fs.getPath()
		const pathes = target.split('/')
		if (!pathes[pathes.length - 1]) {
			this.error('illegal filename')
			return
		}
		let index = 0
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.append(str, path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			index++
		}
		this.fs.cd(workDir)

	}
	visit(page: string): void {
		if (this.pages.indexOf(page) >= 0) {
			const host = document.domain.split('.')
			window.location.href = 'http://' + page + '.' + host[1] + '.' + host[2]
		} else {
			this.error('no such page')
		}
	}
	error(err: string): void {
		this.echo(err)
	}
	render(target: string): void {
		const workDir = this.fs.getPath()
		const pathes = target.split('/')
		if (!pathes[pathes.length - 1]) {
			this.error('illegal filename')
			return
		}
		let index = 0
		let content: string[];
		while (index < pathes.length) {
			const path = pathes[index]
			const handler: VFSResponse = index < pathes.length - 1
				? this.fs.cd(path)
				: this.fs.cat(path)
			if (handler.code < 0) {
				this.error(handler.message)
				this.fs.cd(workDir)
				return
			}
			content = handler.result;
			index++
		}
		this.fs.cd(workDir);

		this.particles.setText(content[0])
		this.particles.render()
	}
	parse(command: string): string[] {
		let inStr = false
		return command.split('')
			.reduce((words: string[], c: string) => {
				if (c === '"') {
					inStr = !inStr
				} else if (c === ' ' && !inStr) {
					if (words[words.length] !== '') {
						words = [...words, '']
					}
				} else {
					words[words.length - 1] += c
				}
				return words
			}, [''])
	}
	exec(command: string): void {
		const shell: any = this
		let prefix: string = shell.fs.getPath() + ' > '
		shell.print(prefix + command)
		const words: string[] = shell.parse(command)
		const [bin, ...args] = words

		if (!bin) {
			//do nothing
		} else if (typeof shell[bin] === 'function') {
			shell[bin](...args)
		} else {
			shell.echo('v-shell : command not found.')
		}

		prefix = shell.fs.getPath() + ' > '
		shell.command = ''
		shell.cursor = 0
	}
}
