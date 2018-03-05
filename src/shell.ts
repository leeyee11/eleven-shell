interface VFSResponse{
	code:number, //-1 for error; 0 for success;
	message:string, //error message or request result;
	result:Array<string>
}	

class Shell{
	//base property
	private node:HTMLElement;
	private fs:VFS;
	private history:Array<string>;
	private historyPointer:number;
	private keywords:Array<string>;
	private pages:Array<string>;
	private particles:Particles;
	private label:string;
	//widget
	private enterLine:any;//based on HTMLElement


	constructor(app:HTMLElement){
		this.node=document.createElement('code');
		app.appendChild(this.node);
		this.fs=new VFS();
		this.history=[];
		this.historyPointer=null;
		this.keywords=['ls','cd','cat','echo','help','clear','touch','render','visit'];
		this.pages=['music','markdown','lab','toys','ui','resume'];
		this.particles=new Particles(app);
	}
	newLine():void{
		const shell=this;
		shell.enterLine=document.createElement('div');
		shell.enterLine.style.position="relative";
		shell.enterLine.label=document.createElement('label');
		shell.enterLine.label.innerHTML=shell.fs.getPath()+' > ';
		shell.enterLine.label.style.position="absolute";
		shell.enterLine.input=document.createElement('input');
		shell.enterLine.input.spellcheck=false;
		shell.enterLine.input.value="";
		shell.enterLine.input.style.paddingLeft=(shell.fs.getPath()+' > ').length*9.6+"px";
		shell.enterLine.input.onkeydown=function(e:any){
			if(e.key=='Enter'){
				shell.history.push(shell.enterLine.input.value);
				shell.historyPointer=shell.history.length;
				shell.exec(shell.enterLine.input.value);
				shell.node.scrollTop=shell.node.scrollHeight;
				shell.enterLine.input.value="";
				shell.enterLine.label.innerHTML=shell.fs.getPath()+' > ';
				shell.enterLine.input.style.paddingLeft=(shell.fs.getPath()+' > ').length*9.6+"px";
				// shell.enterLine.outerHTML="";
				// shell.newLine();

			}else if(e.key=='ArrowUp'){
				if(shell.historyPointer>0){
					shell.enterLine.input.value=shell.history[--shell.historyPointer];
				}
			}else if(e.key=='ArrowDown'){
				if(shell.historyPointer<shell.history.length-1){
					shell.enterLine.input.value=shell.history[++shell.historyPointer];
				}else{
					if(shell.historyPointer<shell.history.length){
						++shell.historyPointer;
					}
					shell.enterLine.input.value="";
				}
			}else if(e.key=='Tab'){
				e.preventDefault();

				if(shell.enterLine.input.value.split(' ').length==1){
					for(let kw of shell.keywords){
						if(kw.indexOf(shell.enterLine.input.value)>=0){
							shell.enterLine.input.value=kw;
							break;
						}
					}
				}else if(shell.enterLine.input.value.split(' ').length==2&&shell.enterLine.input.value.split(' ')[0]=='visit'){
					for(let p of shell.pages){
						if(p.indexOf(shell.enterLine.input.value.split(' ')[1])>=0){
							shell.enterLine.input.value="visit "+p;
							break;
						}
					}
				}else if(shell.enterLine.input.value.split(' ').length>1){
					const handler:VFSResponse=shell.fs.ls();
					if(handler.code==0){
						const list=handler.message;
						for(let i of list){
							const words=shell.enterLine.input.value.split(' ');
							if(i.indexOf(words[words.length-1])>=0){
								const command=shell.enterLine.input.value.slice(0,shell.enterLine.input.value.length-words[words.length-1].length);
								shell.enterLine.input.value=command+i;
								break;
							}
						}
					}
				}
			}
		}
		shell.enterLine.input.oninput=function(e:any){
			if(shell.enterLine.input.value.length>=50){
				shell.enterLine.input.value=shell.enterLine.input.value.slice(0,50);
			}
		}
		shell.enterLine.appendChild(shell.enterLine.label);
		shell.enterLine.appendChild(shell.enterLine.input);
		shell.node.appendChild(shell.enterLine);
		shell.enterLine.input.focus();
	}
	ls(path:string):void{
		let dir:string;
		if(path&&path=="/"){
			this.error("permission denied");
			return;
		}
		if(path&&path[path.length-1]=="/"){
			dir=path.slice(0,path.length-1);
		}else{
			dir=path;
		}
		//cd dir
		if(dir){
			//store currentDir
			const currentDir=this.fs.getPath()
			//cd target dir
			const handler:VFSResponse=this.fs.cd(dir);
			console.log("ls",dir);
			if(handler.code==0){
				const list=this.fs.ls().result;
				let str="";
				for(let i of list){
					str+=i+" ";
				}
				this.echo(str);
				//restore currentDir without check
				this.fs.cd(currentDir);
			}else{
				this.error(handler.message);
			}
		}else{
			const list=this.fs.ls().message;
			let str="";
			for(let i of list){
				str+=i+" ";
			}
			this.echo(str);
		}			

	}
	cd(path:string):void{
		//if path == null
		if(!path){
			path='~';
		}
		//if path end width '/'
		if(path[path.length-1]=="/"){
			path.slice(0,path.length-1)
		}
		const handler:VFSResponse=this.fs.cd(path);
		if(handler.code<0){
			this.error(handler.message);
		}
	}
	pwd():void{
		this.echo(this.fs.getPath());
	}
	help():void{
		this.echo('visit\t[home|music|markdown|lab|toys|ui|resume]');
		this.echo('render\t[file]');
		this.echo('echo\t[arg...]');
		this.echo('touch\t[file]');
		this.echo('cat\t[file]');
		this.echo('cd\t[dir]');
		this.echo('clear\t');
		this.echo('help\t');
		this.echo('pwd\t')
		this.echo('ls\t');
	}
	cat(path:string):void{
		let handler;
		if(path.lastIndexOf('/')==-1){
			const fileName=path;
			handler=this.fs.cat(fileName);

		}else{
			const fileName=path.slice(path.lastIndexOf('/')+1,path.length);
			const dir=path.slice(0,path.lastIndexOf('/'));
			
			//store currentDir
			const currentDir=this.fs.getPath()

			//cd dir
			if(dir){this.fs.cd(dir);}
			
			handler=this.fs.cat(fileName);
			
			//restore currentDir
			if(dir){this.fs.cd(currentDir);}
		}

		if(handler.code==0){
			this.echo(handler.result[0]);
		}else if(handler.code<0){
			this.error(handler.message)
		}
	}
	touch(fileName:string):void{
		const handler:VFSResponse=this.fs.touch(fileName);
		if(handler.code<0){
			this.error(handler.message);
		}
	}
	mkdir(path:string):void{
		let handler;
		//if path end width '/'
		if(path=="/"){
			this.error("/: is a folder");
			return;
		}
		if(path[path.length-1]=="/"){
			path.slice(0,path.length-1);
		}
		if(path.lastIndexOf('/')==-1){
			const folderName=path;
	 		handler=this.fs.mkdir(folderName);
		}else{
			const folderName=path.slice(path.lastIndexOf('/')+1,path.length);
			const dir=path.slice(0,path.lastIndexOf('/'));
			
			//store currentDir
			const currentDir=this.fs.getPath()

			//cd dir
			if(dir){this.fs.cd(dir);}
		
	 		handler=this.fs.mkdir(folderName);
			
				//restore currentDir
			if(dir){this.fs.cd(currentDir);}
		}

		if(handler.code<0){
			this.error(handler.message);
		}
	}
	clear():void{
		this.node.innerHTML="";
		this.newLine();
	}
	echo(str:string):void{
		const line=document.createElement('div');
		if(str){
			const words=str.split(' ');
			for(const word of words){
				const node=document.createElement('span');
				node.innerHTML=word;
				const space=document.createElement('span');
				space.innerHTML=' ';
				line.appendChild(node);
				line.appendChild(space);
			}
		}
		this.node.insertBefore(line,this.enterLine);
	}
	write(str:string,target:string):void{
		const handler:VFSResponse=this.fs.write(str,target);
		if(handler.code<0){
			this.error(handler.message);
		}
	}
	append(str:string,target:string):void{
		const handler:VFSResponse=this.fs.append(str,target);
		if(handler.code<0){
			this.error(handler.message);
		}
	}
	visit(page:string):void{
		if(this.pages.indexOf(page)>=0){
			const host=document.domain.split('.'); 
			window.location.href='http://'+page+'.'+host[1]+'.'+host[2];
		}else{
			this.error('no such page')
		}
	}
	error(err:string):void{
		this.echo(err);
	}
	render(path:string):void{
		let handler;
		if(path.lastIndexOf('/')==-1){
			const fileName=path;
			handler=this.fs.cat(fileName);

		}else{
			const fileName=path.slice(path.lastIndexOf('/')+1,path.length);
			const dir=path.slice(0,path.lastIndexOf('/'));
			
			//store currentDir
			const currentDir=this.fs.getPath()

			//cd dir
			if(dir){this.fs.cd(dir);}
			
			handler=this.fs.cat(fileName);
			
			//restore currentDir
			if(dir){this.fs.cd(currentDir);}
		}

		if(handler.code==0){
			this.particles.setText(handler.result[0]);
			this.particles.render();
		}else if(handler.code<0){
			this.error(handler.message)
		}
	}
	exec(command:string):void{
		command.replace(/\s*/g,' ');
		this.label=this.fs.getPath()+' > ';

		this.echo(this.label+command);

		const words=command.split(' ');

		switch(words[0]){
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
				if(command.replace(/\".*\"/g,'').indexOf('>>')>0){
					const target=command.replace(/\".*\"/g,'').split('>>')[1].replace(/\s/g,'');
					const str=command.split('"')[1]
					this.append(str,target);
				}else if(command.replace(/\".*\"/g,'').indexOf('>')>0){
					const target=command.replace(/\".*\"/g,'').split('>')[1].replace(/\s/g,'');
					const str=command.split('"')[1]
					this.write(str,target);
				}else{
					const str=command.split('"')[1]
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
				this.error('bash : command not found '+words[0]);
				break;
		}
	}

}
