class VFS{
	constructor(){
		this.root=new VFSFolder('~',null);
		this.pointer=this.root;
	}
	cd(path){
		let names=path.split('/');
		let exist=true;
		let tempPointer=this.pointer;
		for(let name of names){
			if(names.indexOf(name)==0&&name=='~'){
				tempPointer=this.root;
			}else if(tempPointer.children[name]&&tempPointer.children[name].type=="folder"){
				tempPointer=tempPointer.children[name];
			}else{
				exist=false;
				break;
			}
		}
		if(exist){
			this.pointer=tempPointer;
			return {code:0};
		}else{
			return {code:-1,message:'no such a folder'}
		}
	}
	mkdir(name){
		if(this.pointer.children[name]){
			return {code:-1,message:"this folder has existed"};
		}else{
			this.pointer.children[name]=new VFSFolder(name,this.pointer);
			return {code:0};
		}
	}
	touch(name){
		if(this.pointer.children[name]){
			return {code:-1,message:"this file has existed"};
		}else{
			this.pointer.children[name]=new VFSFile(name,this.pointer);
			return {code:0};
		}
	}
	write(str,target){
		if(this.pointer.children[target]==null){
			this.touch(target);
		}
		this.pointer.children[target].write(str);
		return {code:0}
	}
	append(str,target){
		if(this.pointer.children[target]==null){
			this.touch(target);
		}
		this.pointer.children[target].append(str);
		return {code:0};
	}
	ls(){
		let result=[]
		for(let name of Object.keys(this.pointer.children)){
			result.push(name);
		}
		return {code:0,message:result};
	}
	cat(name){
		if(this.pointer.children[name]){
			if(this.pointer.children[name].getType()=="file"){
				return {code:0,message:this.pointer.children[name].read()};
			}else{
				return {code:-1,message:this.pointer.children[name].getName()+' is a folder'};
			}
		}else{
			return {code:-1,message:'file not exist'};
		}
	}
	getPath(){
		return this.pointer.getPath();
	}
}
class VFSFolder{
	constructor(name,parent){
		this.name=name;
		this.type="folder";
		this.parent=parent;
		this.children={};
		this.children['.']=this;
		if(parent){
			this.children['..']=this.parent;
		}
	}
	getName(){
		return this.name;
	}
	getPath(){
		if(this.getName()!='~'){
			return this.parent.getPath()+'/'+this.getName();
		}else{
			return this.getName();
		}
	}
	getType(){
		return this.type;
	}
}
class VFSFile{
	constructor(name,parent){
		this.name=name;
		this.type="file";
		this.parent=parent;
		this.content="";
	}
	write(str){
		this.content=str;
	}
	append(str){
		this.content+=str;
	}
	read(){
		return this.content;
	}
	getName(){
		return this.name;
	}
	getPath(){
		return this.parent.getPath()+'/'+this.getName();
	}
	getType(){
		return this.type;
	}
}