'use strict';

class Window{
  constructor(){
    this.document = new Document();
  }
};

class Document{
  constructor(){}
};

const window = new Window();
const {document} = window;

const O = {
  global: null,
  isNode: null,
  isBrowser: null,

  doc: document,
  head: document.head,
  body: document.body,

  /*
    Constants
  */

  pi: Math.PI,
  pi2: Math.PI * 2,
  pih: Math.PI / 2,
  pi32: Math.PI * 3 / 2,

  /*
    Symbols
  */

  static: Symbol('static'),

  /*
    Project
  */

  project: null,

  /*
    Cache
  */

  moduleCache: null,

  /*
    Other parameters
  */

  enhancedRNG: 0,

  /*
    Main functions
  */

  init(loadProject=1){
    var global = O.global = new Function('return this;')();
    var env = String(global);

    switch(env){
      case '[object Window]': env = 'browser'; break;
      case '[object global]': env = 'node'; break;
    }

    O.env = env;

    var isBrowser = O.isBrowser = env === 'browser';
    var isNode = O.isNode = env === 'node';

    if(isBrowser){
      if(global.navigator.vendor !== 'Google Inc.')
        return O.error('Please use Chrome.');
    }

    if(!global.isConsoleOverriden)
      O.overrideConsole();

    O.moduleCache = O.obj();

    O.enhancedRNG = 1;
    O.randState = O.Buffer.from(O.ca(32, () => Math.random() * 256));
    O.random();
    O.enhancedRNG = 0;

    if(loadProject){
      O.project = O.urlParam('project');

      if(!O.projectTest(O.project))
        return O.error(`Illegal project name ${JSON.stringify(O.ascii(O.project))}".`);

      if(O.project == null){
        O.rf(`projects.txt`, (status, projects) => {
          if(status != 200) return O.error(`Failed to load projects list.`);

          O.title('Projects');
          O.sortAsc(O.sanl(projects)).forEach((project, index, projects) => {
            O.ceLink(O.body, O.projectToName(project), `/?project=${project}`);
            if(index < projects.length - 1) O.ceBr(O.body);
          });
        });
      }else{
        O.req(`/projects/${O.project}/main`);
      }
    }
  },

  overrideConsole(){
    var global = O.global;
    var isNode = O.isNode;

    O.util = isNode ? require('util') : null;

    var console = global.console;
    var logOrig = console.log;

    var indent = 0;

    var logFunc = (...args) => {
      if(args.length === 0){
        logOrig('');
        return;
      }

      if(isNode){
        var indentStr = '  '.repeat(indent);
        var str = O.inspect(args);

        str = O.sanl(str).map(line => {
          return `${indentStr}${line}`;
        }).join('\n');

        logOrig(str);
      }else{
        logOrig(...args);
      }

      return args[args.length - 1];
    };

    logFunc.inc = (val=1) => {
      indent += val;
    };

    logFunc.dec = (val=1) => {
      indent -= val;
      if(indent < 0) indent = 0;
    };

    logFunc.get = () => {
      return indent;
    };

    logFunc.set = i => {
      indent = i;
    };

    global.log = logFunc;
    global.isConsoleOverriden = 1;
  },

  inspect(arr){
    if(!O.isNode)
      throw new TypeError('Function "inspect" is available only in Node.js');

    var {util} = O;

    if(!(arr.length === 1 && typeof arr[0] === 'string'))
      arr = arr.map(val => util.inspect(val));

    return arr.join(' ');
  },

  title(title){
    O.body.innerHTML = '';
    var h1 = O.ce(O.body, 'h1');
    O.ceText(h1, title);
  },

  error(msg){
    O.body.classList.remove('has-canvas');
    O.body.style.backgroundColor = '#ffffff';

    O.title('Error Occured');
    O.ceText(O.body, msg);
    O.ceBr(O.body, 2);
    O.ceLink(O.body, 'Home Page', '/');
  },

  /*
    Project functions
  */

  uppercaseWords: ['fs', '2d', '3d'],

  projectToName(project){
    return project.split(/\-/g).map((word, index) => {
      if(O.shouldUpper(word)) word = word.toUpperCase();
      else if(index === 0) word = O.cap(word);

      return word;
    }).join(' ');
  },

  shouldUpper(word){ return O.uppercaseWords.includes(word); },
  projectTest(project){ return /^[\!-\~]+$/.test(project); },

  /*
    URL functions
  */

  href(){
    return window.VIRTUAL_URL || window.location.href;
  },

  urlParam(param, defaultVal=null){
    var url = O.href();
    var match = url.match(new RegExp(`[\\?\\&]${param}=([^\\&]*)`));

    if(match === null){
      if(new RegExp(`[\\?\\&]${param}(?:\\&|$)`).test(url))
        match = '';
    }else{
      match = window.unescape(match[1]);
    }

    if(match === null) return defaultVal;
    return match;
  },

  /*
    DOM functions
  */

  ge(selector){
    return O.doc.getElementById(selector);
  },

  qsa(parent, selector=null){
    if(selector === null){
      selector = parent;
      parent = O.doc;
    }

    return parent.querySelectorAll(selector);
  },

  ce(parent, tag, classNames=null){
    var elem = O.doc.createElement(tag);

    if(parent !== null)
      parent.appendChild(elem);

    if(classNames !== null){
      if(typeof classNames === 'string')
        classNames = classNames.split(' ');

      classNames.forEach(className => {
        if(className === '')
          return;
        
        elem.classList.add(className);
      });
    }

    return elem;
  },

  ceDiv(parent, classNames){
    return O.ce(parent, 'div', classNames);
  },

  ceBr(parent, num=1){
    while(num--) O.ce(parent, 'br');
  },

  ceHr(parent, classNames){
    return O.ce(parent, 'hr', classNames);
  },

  ceText(parent, text){
    var t = O.doc.createTextNode(text);
    parent.appendChild(t);
    return t;
  },

  ceLink(parent, label, href, classNames){
    var link = O.ce(parent, 'a', classNames);
    link.href = href;
    if(!(label === null || label === '')) O.ceText(link, label);
    return link;
  },

  ceInput(parent, type, classNames){
    var input = O.ce(parent, 'input', classNames);
    input.type = type;
    if(type === 'text') input.autocomplete = 'off';
    return input;
  },

  ceRadio(parent, name, value, label=null, classNames){
    var radio = O.ceInput(parent, 'radio', classNames);
    radio.name = name;
    radio.value = value;
    if(!(label === null || label === '')) O.ceText(parent, label);
    return radio;
  },

  ceH(parent, type, text=null, classNames){
    var h = O.ce(parent, `h${type}`, classNames);
    if(!(text === null || text === '')) O.ceText(h, text);
    return h;
  },

  ceLabel(parent, text=null, classNames){
    var label = O.ce(parent, 'label', classNames);
    if(!(text === null || text === '')) O.ceText(label, text);
    return label;
  },

  ceCanvas(enhanced=false){
    O.body.classList.add('has-canvas');

    var w = window.innerWidth;
    var h = window.innerHeight;
    var canvas = O.ce(O.body, 'canvas');
    var g = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    var {style} = canvas;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';

    g.fillStyle = 'white';
    g.strokeStyle = 'black';
    g.fillRect(0, 0, w, h);

    if(enhanced)
      g = new O.EnhancedRenderingContext(g);

    return {w, h, g};
  },

  /*
    Request processing functions
  */

  urlTime(url){
    var char = url.indexOf('?') !== -1 ? '&' : '?';
    return `${url}${char}_=${Date.now()}`;
  },

  rf(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    var xhr = new window.XMLHttpRequest();

    if(isBinary){
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4){
        if(isBinary){
          cb(xhr.status, O.Buffer.from(xhr.response));
        }else{
          cb(xhr.status, xhr.responseText);
        }
      }
    };

    if(file.startsWith('/') && window.VIRTUAL_URL_BASE)
      file = `${window.VIRTUAL_URL_BASE}${file.substring(1)}`;

    xhr.open('GET', O.urlTime(file));
    xhr.send(null);
  },

  rfAsync(...args){
    return new Promise(res => {
      O.rf(...args, (status, code) => {
        if(status !== 200) return res(null);
        res(code);
      });
    });
  },

  async rfCache(...args){
    var cache = O.moduleCache;
    var path = args[0];

    if(path in cache) return cache[path];

    var data = await O.rfAsync(...args);
    if(data === null) return null;

    return data;
  },

  rfLocal(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    O.rf(`/projects/${O.project}/${file}`, isBinary, cb);
  },

  async req(path){
    var cache = O.moduleCache;
    var pathOrig = path;
    var script;

    if(path in cache) return cache[path];
    
    if(path.endsWith('.js')){
      script = await O.rfAsync(path);
    }else if((script = await O.rfAsync(`${path}.js`)) !== null){
      path += '.js';
      if(path in cache) return cache[path];
    }else{
      path += '/index.js';
      if(path in cache) return cache[path];
      script = await O.rfAsync(path);
    }

    if(script === null){
      O.error(`Failed to load script for project ${JSON.stringify(O.project)}`);
      return null;
    }

    path = path.split('/');
    path.pop();

    script = script.replace(/^const (?:O|debug) .+/gm, '');
    script = script.replace(/ \= require\(/g, ' \= await require(');

    var AsyncFunction = (async () => {}).constructor;

    var module = {exports: {}};
    var {exports} = module;

    var func = new AsyncFunction('window', 'document', 'Function', 'O', 'require', 'module', 'exports', script);
    await func(window, document, Function, O, require, module, exports);

    return cache[pathOrig] = module.exports;

    async function require(newPath){
      var resolvedPath;

      if(/^https?\:\/\//.test(newPath)){
        resolvedPath = newPath;
      }else if(newPath.startsWith('.')){
        var oldPath = path.slice();

        newPath.split('/').forEach(dir => {
          switch(dir){
            case '.': break;
            case '..': oldPath.pop(); break;
            default: oldPath.push(dir); break;
          }
        });

        resolvedPath = oldPath.join('/');
      }else{
        return null;
      }

      var exportedModule = await O.req(resolvedPath);

      return exportedModule;
    }
  },

  require(script, cb=O.nop){
    if(/\.js$/.test(script)){
      script = `/projects/${O.project}/${script}`;
    }else{
      script = `/projects/${script}/index.js`;
    }

    O.rf(script, false, (status, data) => {
      if(status !== 200)
        return O.error('Cannot load script.');

      var module = {
        exports: {}
      };

      var func = new Function('O', 'module', data);
      func(O, module);

      cb(module.exports);
    });
  },

  /*
    String functions
  */

  buff2ascii(buff){
    return [...buff].map(cc => {
      return O.sfcc(cc);
    }).join('');
  },

  ascii(str){
    return str.split('').map(char => {
      if(char >= ' ' && char <= '~') return char;
      return '?';
    }).join('');
  },

  sanl(str){
    return str.split(/\r\n|\r|\n/g);
  },

  sanll(str){
    return str.split(/\r\n\r\n|\r\r|\n\n/g);
  },

  pad(str, len, char='0'){
    str += '';
    if(str.length >= len) return str;
    return char.repeat(len - str.length) + str;
  },

  cap(str, lowerOthers=0){
    if(lowerOthers) str = str.toLowerCase();
    return `${str[0].toUpperCase()}${str.substring(1)}`;
  },

  indent(str, indent){ return `${'  '.repeat(indent)}${str}`; },

  /*
    Array functions
  */

  ca(len, func=O.nop){
    var arr = [];

    for(var i = 0; i !== len; i++)
      arr.push(func(i));

    return arr;
  },

  async caa(len, func){
    var arr = [];

    for(var i = 0; i !== len; i++)
      arr.push(await func(i));

    return arr;
  },

  shuffle(arr){
    var len = arr.length;

    for(var i = 0; i !== len; i++){
      var j = i + O.rand(len - i);
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }

    return arr;
  },

  flatten(arr){
    var a = [];

    arr = arr.slice();

    while(arr.length !== 0){
      var e = arr.shift();

      if(!Array.isArray(e)){
        a.push(e);
        continue;
      }

      e.forEach((a, b) => arr.splice(b, 0, a));
    }

    return a;
  },

  last(arr){ return arr[arr.length - 1]; },

  /*
    Other functions
  */

  enhanceRNG(){
    this.enhancedRNG = 1;
  },

  random(){
    if(!this.enhancedRNG)
      return Math.random();

    var st = O.randState;
    var val = read();

    write(Date.now());
    write(Math.random() * 2 ** 64);

    O.randState = O.sha256(st);
    return val / 2 ** 64;

    function read(){
      var val = st[7];
      for(var i = 6; i !== -1; i--)
        val = val * 256 + st[i];
      return val;
    }

    function write(val){
      st[0] ^= val;
      for(var i = 1; i !== 8; i++)
        st[i] ^= val /= 256;
    }
  },

  rand(a=2, b=null){
    if(b !== null) return a + O.random() * (b - a + 1) | 0;
    return O.random() * a | 0;
  },

  randf(a=1, b=null){
    if(b !== null) return a + O.random() * (b - a);
    return O.random() * a;
  },

  randInt(start, prob){
    var num = start;
    while(O.randf() < prob) num++;
    return num;
  },

  randElem(arr, splice=0){
    var index = O.rand(arr.length);
    if(splice) return arr.splice(index, 1)[0];
    return arr[index];
  },

  repeat(num, func){
    for(var i = 0; i !== num; i++) func(i);
  },

  async repeata(num, func){
    for(var i = 0; i !== num; i++) await func(i);
  },

  bound(val, min, max){
    if(val < min) return min;
    if(val > max) return max;
    return val;
  },

  int(val, min=null, max=null){
    if(typeof val == 'object') val = 0;
    else val |= 0;
    if(min != null) val = O.bound(val, min, max);
    return val;
  },

  hsv(val, col=new Uint8Array(3)){
    var v = Math.round(val * (256 * 6 - 1)) | 0;
    var h = v & 255;

    if(v < 256) col[2] = 0, col[0] = 255, col[1] = h;
    else if(v < 256 * 2) col[2] = 0, col[1] = 255, col[0] = 255 - h;
    else if(v < 256 * 3) col[0] = 0, col[1] = 255, col[2] = h;
    else if(v < 256 * 4) col[0] = 0, col[2] = 255, col[1] = 255 - h;
    else if(v < 256 * 5) col[1] = 0, col[2] = 255, col[0] = h;
    else col[1] = 0, col[0] = 255, col[2] = 255 - h;

    return col;
  },

  hsvx(val){
    if(val === 0) return O.hsv(0);
    while(val < 1 / 49) val *= 49;
    return O.hsv(val - 1 / 64);
  },

  dist(x1, y1, x2, y2){
    var dx = x2 - x1;
    var dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
  },

  enum(arr){
    var obj = O.obj();
    obj.name = index => arr[index];

    arr.forEach((name, index) => {
      obj[name] = index;
    });

    return obj;
  },

  sleep(time=0){
    return new Promise(res => {
      setTimeout(() => {
        res();
      }, time);
    });
  },

  while(func){
    return new Promise(res => {
      var test = async () => {
        if(await func()) return setTimeout(test);
        res();
      };

      test();
    });
  },

  commonProto(arr, calcProtos=1){
    if(arr.length === 0) return null;

    if(calcProtos) arr = arr.map(obj => O.proto(obj));
    if(arr.length === 1) return arr[0];

    return arr.reduce((prev, proto) => {
      if(prev === null || proto === null) return null;
      if(proto === prev) return prev;

      if(proto instanceof prev.constructor) return prev;
      if(prev instanceof proto.constructor) return proto;

      do{
        prev = O.proto(prev);
      }while(!(prev === null || proto instanceof prev.constructor));

      return prev;
    });
  },

  proxify(oldFunc, newFunc){
    return (...args) => {
      return newFunc(oldFunc, args);
    };
  },

  bool(val){ return Boolean(O.int(val)); },
  sortAsc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? 1 : elem1 < elem2 ? -1 : 0); },
  sortDesc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? -1 : elem1 < elem2 ? 1 : 0); },
  undupe(arr){ return arr.filter((a, b, c) => c.indexOf(a) === b); },
  rgb(...col){ return `#${col.map(val => O.pad((val | 0).toString(16), 2)).join('')}`; },
  binLen(a){ return a && (Math.log2(a) | 0) + 1; },
  raf(func){ return window.requestAnimationFrame(func); },
  obj(proto=null){ return Object.create(proto); },
  keys(obj){ return Reflect.ownKeys(obj); },
  cc(char, index=0){ return char.charCodeAt(index); },
  sfcc(cc){ return String.fromCharCode(cc); },
  hex(val, bytesNum){ return val.toString(16).toUpperCase().padStart(bytesNum << 1, '0'); },
  hypot(x, y){ return Math.sqrt(x * x + y * y); },
  proto(obj){ return Object.getPrototypeOf(obj); },

  /*
    Events
  */

  ael(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.addEventListener(type, func);
  },

  rel(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.removeEventListener(type, func);
  },

  pd(evt, stopPropagation=0){
    evt.preventDefault();
    if(stopPropagation) evt.stopPropagation();
  },

  /*
    Constructors
  */

  Vector: class{
    constructor(x=0, y=0){
      this.set(x, y);
    }

    static fromAngle(len, angle){
      var x = Math.cos(angle) * len;
      var y = Math.sin(angle) * len;

      return new O.Vector(x, y);
    }

    set(x, y){
      if(x instanceof O.Vector)
        ({x, y} = x);

      this.x = x;
      this.y = y;

      return this;
    }

    clone(){
      return new O.Vector(this.x, this.y);
    }

    add(x, y){
      if(x instanceof O.Vector)
        ({x, y} = x);

      this.x += x;
      this.y += y;

      return this;
    }

    sub(x, y){
      if(x instanceof O.Vector)
        ({x, y} = x);

      this.x -= x;
      this.y -= y;

      return this;
    }

    mul(val){
      this.x *= val;
      this.y *= val;

      return this;
    }

    div(val){
      this.x /= val;
      this.y /= val;

      return this;
    }

    combine(len, angle){
      this.x += Math.cos(angle) * len;
      this.y += Math.sin(angle) * len;

      return this;
    }

    dec(x, y){
      if(x instanceof O.Vector)
        ({x, y} = x);

      if(x !== 0){
        var sx = this.x > 0 ? 1 : -1;
        if(Math.abs(this.x) > x) this.x = x * sx - this.x;
        else this.x = 0;
      }
  
      if(y !== 0){
        var sy = this.y > 0 ? 1 : -1;
        if(Math.abs(this.y) > y) this.y = y * sy - this.y;
        else this.y = 0;
      }

      return this;
    }

    len(){
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lenM(){
      return Math.abs(this.x) + Math.abs(this.y);
    }

    setLen(len){
      var angle = this.angle();

      this.x = Math.cos(angle) * len;
      this.y = Math.sin(angle) * len;

      return this;
    }

    angle(){
      return Math.atan2(this.y, this.x);
    }

    setAngle(angle){
      var len = this.len();

      this.x = Math.cos(angle) * len;
      this.y = Math.sin(angle) * len;

      return this;
    }

    norm(){
      this.div(this.len());

      return this;
    }

    dist(x, y){
      if(x instanceof O.Vector)
        ({x, y} = x);

      var dx = this.x - x;
      var dy = this.y - y;
      
      return Math.sqrt(dx * dx + dy * dy);;
    }

    maxLen(maxLen){
      if(this.len() > maxLen)
        this.setLen(maxLen);

      return this;
    }

    rotate(angle){
      var sin = Math.sin(angle);
      var cos = Math.cos(angle);
      var x = this.x * cos - this.y * sin;
      var y = this.x * sin + this.y * cos;

      this.x = x;
      this.y = y;

      return this;
    }

    isIn(x1, y1, x2, y2){
      var {x, y} = this;
      return x >= x1 && y >= y1 && x < x2 && y < y2;
    }
  },

  Color: class extends Uint8Array{
    constructor(r, g, b){
      super(3);

      this.set(r, g, b);
    }

    static from(rgb){
      return new O.Color(rgb[0], rgb[1], rgb[2]);
    }

    static rand(hsv=0){
      var rgb;

      if(!hsv) rgb = O.ca(3, () => O.rand(256));
      else rgb = O.hsv(O.randf(1));

      return O.Color.from(rgb);
    }

    clone(){
      return O.Color.from(this);
    }

    from(col){
      this[0] = col[0];
      this[1] = col[1];
      this[2] = col[2];
      this.updateStr();
    }

    set(r, g, b){
      this[0] = r;
      this[1] = g;
      this[2] = b;
      this.updateStr();
    }

    setR(r){
      this[0] = r;
      this.updateStr();
    }

    setG(g){
      this[1] = g;
      this.updateStr();
    }

    setB(b){
      this[2] = b;
      this.updateStr();
    }

    updateStr(){
      this.str = `#${[...this].map(byte => {
        return byte.toString(16).padStart(2, '0');
      }).join('')}`;
    }

    toString(){
      return this.str;
    }
  },

  SimpleGrid: class{
    constructor(w, h, func=null, d=null){
      this.w = w;
      this.h = h;

      if(d === null){
        d = O.ca(h, y => {
          return O.ca(w, x =>{
            if(func === null) return O.obj();
            return func(x, y);
          });
        });
      }

      this.d = d;
    }

    iterate(func){
      var {w, h} = this;

      for(var y = 0; y !== h; y++)
        for(var x = 0; x !== w; x++)
          func(x, y, this.get(x, y));

    }

    iterAdj(x, y, func){
      var visited = new O.Map2D();
      var queue = [x, y];

      while(queue.length !== 0){
        x = queue.shift(), y = queue.shift();
        if(visited.has(x, y)) continue;

        visited.add(x, y);
        if(!func(x, y, this.get(x, y))) continue;

        this.adj(x, y, (x, y, d) => {
          if(d === null) return;
          if(!visited.has(x, y)) queue.push(x, y);
        });
      }
    }

    adj(x, y, func){
      return func(x, y - 1, this.get(x, y - 1), 0) ||
             func(x + 1, y, this.get(x + 1, y), 1) ||
             func(x, y + 1, this.get(x, y + 1), 2) ||
             func(x - 1, y, this.get(x - 1, y), 3);
    }

    nav(cs, dir){
      switch(dir){
        case 0: cs[1]--; break;
        case 1: cs[0]++; break;
        case 2: cs[1]++; break;
        case 3: cs[0]--; break;
      }

      return this.get(cs[0], cs[1]);
    }

    get(x, y){
      if(!this.includes(x, y)) return null;
      return this.d[y][x];
    }

    set(x, y, val){
      if(!this.includes(x, y)) return null;
      this.d[y][x] = val;
    }

    includes(x, y){
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
  },

  Grid: class{
    constructor(w, h, func){
      var grid = O.ca(w, x => O.ca(h, y => new O.PathTile(func(x, y))));
      grid.w = w;
      grid.h = h;
      grid.iterate = this.iterate.bind(grid);
      return grid;
    }
    
    iterate(func){
      var {w, h} = this;
      var x, y;
      for(y = 0; y < h; y++) for(x = 0; x < w; x++) func(x, y, this[x][y]);
    }
  },

  PathTile: class{
    constructor(wall){
      this.wall = wall;
      this.visited = 0;
      this.heuristicDist = 0;
      this.pathDist = 0;
      this.totalDist = 0;
      this.dir = -1;
    }
  },

  TilesGrid: class{
    constructor(g=null){
      this.isNode = O.env === 'node';
      this.bgEnabled = 1;

      this.w = 1;
      this.h = 1;
      this.s = 32;

      this.tileParams = [];
      this.drawFunc = O.nop;

      this.g = g !== null ? g : O.ceCanvas(1).g;

      this.iw = this.g.g.canvas.width;
      this.ih = this.g.g.canvas.height;
      this.iwh = this.iw / 2;
      this.ihh = this.ih / 2;

      this.resize();

      var tileParams = this.tileParams;

      this.Tile = class{
        constructor(params){
          tileParams.forEach((param, index) => {
            this[param] = params[index];
          });
        }
      };

      this.emptyFunc = () => [];
      this.d = [];
      this.create();
    }

    setWH(w, h){
      this.w = w;
      this.h = h;
      this.wh = w / 2;
      this.hh = h / 2;
      this.resize();
    }

    setSize(s){
      this.s = s;
      this.resize();
    }

    setTileParams(params){
      this.tileParams.length = [];
      params.forEach(param => this.tileParams.push(param));
    }

    setDrawFunc(func = O.nop){
      this.drawFunc = func;
    }

    updateIWH(){
      if(this.isNode)
        return;

      var iw = window.innerWidth;
      var ih = window.innerHeight;
      if(this.iw == iw && this.ih == ih) return;

      this.iw = iw;
      this.ih = ih;
      this.iwh = iw / 2;
      this.ihh = ih / 2;

      var g = this.g.g;
      var canvas = g.canvas;

      canvas.width = iw;
      canvas.height = ih;
    }

    create(func=this.emptyFunc){
      var d = this.d;
      d.length = this.w;
      d.fill(null);

      d.forEach((a, x) => {
        d[x] = O.ca(this.h, O.nop);
      });

      this.iterate((x, y) => {
        d[x][y] = new this.Tile(func(x, y));
      });
    }

    iterate(func){
      var {w, h, d, g} = this;
      var x, y;

      for(y = 0; y < h; y++){
        for(x = 0; x < w; x++){
          func(x, y, d[x][y], g);
        }
      }
    }

    resize(){
      this.updateIWH();

      var g = this.g;

      g.resetTransform();
      g.lineWidth = 1;

      g.fillStyle = 'darkgray';
      g.fillRect(0, 0, this.iw, this.ih);

      var tx = this.iw - this.w * this.s >> 1;
      var ty = this.ih - this.h * this.s >> 1;

      g.translate(Math.max(tx, 0), Math.max(ty, 0));
      g.scale(this.s);

      if(this.bgEnabled){
        g.fillStyle = 'white';
        g.fillRect(0, 0, this.w, this.h);
      }

      g.textBaseline = 'middle';
      g.textAlign = 'center';
      g.font(this.s * .8);
    }

    draw(){
      this.iterate(this.drawFunc);
    }

    drawTile(x, y){
      this.drawFunc(x, y, this.d[x][y], this.g);
    }

    drawFrame(x, y, func = null){
      var g = this.g;
      var s1 = 1 / this.s + 1;

      if(func === null){
        g.beginPath();
        g.rect(x, y, 1, 1);
        g.stroke();
      }else{
        this.adjacent(x, y, (px, py, d1, dir) => {
          if(func(d1, dir)){
            switch(dir){
              case 0:
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x + s1, y);
                g.stroke();
                break;
              case 1:
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x, y + s1);
                g.stroke();
                break;
              case 2:
                g.beginPath();
                g.moveTo(x, y + 1);
                g.lineTo(x + s1, y + 1);
                g.stroke();
                break;
              case 3:
                g.beginPath();
                g.moveTo(x + 1, y);
                g.lineTo(x + 1, y + s1);
                g.stroke();
                break;
            }
          }
        });
      }
    }

    drawTube(x, y, dirs, size, round){
      var {g} = this;
      g.concaveMode = 1;

      var s1 = (1 - size) / 2;
      var s2 = 1 - s1;

      g.beginPath();

      drawingBlock: {
        if(round === 1){
          var radius = Math.min(size, .5);

          var p1 = (1 - Math.sqrt(radius * radius * 4 - size * size)) / 2;
          var p2 = 1 - p1;

          var phi1 = (1.9 - size / (radius * 4)) * O.pi;
          var phi2 = phi1 + O.pi2 - size / radius * O.pih;

          var dphi = 0;
          var foundArc = 1;

          switch(dirs){
            case 0:
              g.arc(x + .5, y + .5, radius, 0, O.pi2);
              break;

            case 1:
              g.moveTo(x + s2, y + p1);
              g.lineTo(x + s2, y);
              g.lineTo(x + s1, y);
              g.lineTo(x + s1, y + p1);
              break;

            case 2:
              dphi = O.pi2 - O.pih;
              g.moveTo(x + p1, y + s1);
              g.lineTo(x, y + s1);
              g.lineTo(x, y + s2);
              g.lineTo(x + p1, y + s2);
              break;

            case 4:
              dphi = O.pi;
              g.moveTo(x + s1, y + p2);
              g.lineTo(x + s1, y + 1);
              g.lineTo(x + s2, y + 1);
              g.lineTo(x + s2, y + p2);
              break;

            case 8:
              dphi = O.pi2 - (O.pi + O.pih);
              g.moveTo(x + p2, y + s2);
              g.lineTo(x + 1, y + s2);
              g.lineTo(x + 1, y + s1);
              g.lineTo(x + p2, y + s1);
              break;

            default:
              foundArc = 0;
              break;
          }

          if(foundArc)
            break drawingBlock;
        }

        g.moveTo(x + s1, y + s1);

        if(dirs & 1){
          g.lineTo(x + s1, y);
          g.lineTo(x + s2, y);
        }
        g.lineTo(x + s2, y + s1);

        if(dirs & 8){
          g.lineTo(x + 1, y + s1);
          g.lineTo(x + 1, y + s2);
        }
        g.lineTo(x + s2, y + s2);

        if(dirs & 4){
          g.lineTo(x + s2, y + 1);
          g.lineTo(x + s1, y + 1);
        }
        g.lineTo(x + s1, y + s2);

        if(dirs & 2){
          g.lineTo(x, y + s2);
          g.lineTo(x, y + s1);
        }
      }

      if(foundArc){
        if(dirs !== 0)
          g.arc(x + .5, y + .5, radius, phi2 + dphi, phi1 + dphi, 1);
      }else{
        g.closePath();
      }

      g.fill();
      g.stroke();

      g.concaveMode = 0;
    }

    get(x, y){
      var {w, h} = this;
      if(x < 0 || y < 0 || x >= w || y >= h) return null;
      return this.d[x][y];
    }

    adjacent(x, y, func){
      func(x, y - 1, this.get(x, y - 1), 0);
      func(x - 1, y, this.get(x - 1, y), 1);
      func(x, y + 1, this.get(x, y + 1), 2);
      func(x + 1, y, this.get(x + 1, y), 3);
    }
  },

  Map2D: class{
    constructor(x=null, y=null, val=1){
      this.d = O.obj();

      if(x !== null)
        this.add(x, y, val);
    }

    reset(){
      this.d = O.obj();
      return this;
    }

    get(x, y){
      if(!this.has(x, y)) return null;
      return this.d[y][x];
    }

    set(x, y, val=1){
      var {d} = this;

      if(!(y in d)) d[y] = O.obj();
      d[y][x] = val;
    }

    add(x, y, val=1){
      this.set(x, y, val);
    }

    remove(x, y){
      var {d} = this;

      if(!(y in d)) return;
      delete d[y][x];
    }

    has(x, y){
      var {d} = this;

      if(!(y in d)) return 0;
      return d[y][x];
    }

    getArr(){
      var {d} = this;

      var arr = [];

      O.keys(d).forEach(y => {
        y |= 0;
        O.keys(d[y]).forEach(x => {
          x |= 0;
          arr.push([x, y]);
        });
      });

      return arr;
    }
  },

  Map3D: class{
    constructor(x=null, y=null, z = null, val=1){
      this.d = O.obj();

      if(x !== null)
        this.add(x, y, z, val);
    }

    get(x, y, z){
      if(!this.has(x, y, z)) return null;
      return this.d[z][y][x];
    }

    set(x, y, z, val=1){
      var {d} = this;

      if(!(z in d)) d[z] = O.obj();
      d = d[z];

      if(!(y in d)) d[y] = O.obj();
      d[y][x] = val;
    }

    add(x, y, z, val=1){
      this.set(x, y, z, val);
    }

    remove(x, y, z){
      var {d} = this;

      if(!(z in d)) return;
      d = d[z];

      if(!(y in d)) return;
      delete d[y][x];
    }

    has(x, y, z){
      var {d} = this;

      if(!(z in d)) return 0;
      d = d[z];

      
      if(!(y in d)) return 0;
      return d[y][x];
    }

    getArr(){
      var {d} = this;

      var arr = [];

      O.keys(d).forEach(z => {
        z |= 0;
        O.keys(d = d[z]).forEach(y => {
          y |= 0;
          O.keys(d[y]).forEach(x => {
            x |= 0;
            arr.push([x, y, z]);
          });
        });
      });

      return arr;
    }
  },

  EnhancedRenderingContext: class{
    constructor(g){
      this.g = g;
      this.canvas = g.canvas;

      this.w = this.canvas.width;
      this.h = this.canvas.height;

      this.s = 1;
      this.tx = 0;
      this.ty = 0;

      this.rtx = 0;
      this.rty = 0;
      this.rot = 0;
      this.rcos = 0;
      this.rsin = 0;

      this.fontSize = 32;
      this.fontScale = 1;
      this.fontFamily = 'Arial';
      this.fontModifiers = '';

      this.pointsQueue = [];
      this.arcsQueue = [];

      this.concaveMode = false;

      [
        'fillStyle',
        'strokeStyle',
        'globalAlpha',
        'textAlign',
        'textBaseline',
        'lineWidth',
        'globalCompositeOperation',
        'lineCap',
        'lineJoin',
      ].forEach(prop => {
        Object.defineProperty(this, prop, {
          set: val => g[prop] = val,
          get: () => g[prop],
        });
      });

      [
        'clearRect',
        'measureText',
      ].forEach(prop => this[prop] = g[prop].bind(g));

      this.fillStyle = 'white';
      this.strokeStyle = 'black';
      this.textAlign = 'center';
      this.textBaseline = 'middle';

      this.drawImage = g.drawImage.bind(g);

      this.clearCanvas();
    }

    clearCanvas(col=null){
      var {canvas, g} = this;
      if(col !== null) g.fillStyle = col;
      g.fillRect(0, 0, canvas.width, canvas.height);
    }

    createLinearGradient(...params){
      return this.g.createLinearGradient(...params);
    }

    beginPath(){
      this.pointsQueue.length = 0;
      this.arcsQueue.length = 0;
    }

    closePath(){
      var q = this.pointsQueue;
      q.push(1, q[1], q[2]);
    }

    fill(){
      this.finishLine(true);
      this.g.fill();
    }

    stroke(){
      this.finishLine(false);
      this.g.stroke();
    }

    finishLine(fillMode){
      var {g} = this;
      var q = this.pointsQueue;
      var aq = this.arcsQueue;

      var x1 = q[1];
      var y1 = q[2];

      var i = 0;
      var j = 0;

      var concaveMode = this.concaveMode && !fillMode;
      var hasArcs = aq.length !== 0;

      if(concaveMode){
        var fillStyle = g.fillStyle;
        g.fillStyle = g.strokeStyle;
      }

      g.beginPath();

      do{
        if(j < aq.length && aq[j] === i){
          g.arc(aq[j + 1], aq[j + 2], aq[j + 3], aq[j + 4], aq[j + 5], aq[j + 6]);
          j += 7;
        }

        var type = q[i];

        var x2 = q[i + 1];
        var y2 = q[i + 2];

        if(fillMode){
          if(Math.abs(x1 - x2) === 1) x2 = x1;
          if(Math.abs(y1 - y2) === 1) y2 = y1;
        }

        if(!type){
          x1 = x2;
          y1 = y2;
          continue;
        }

        if(fillMode){
          g.lineTo(x2, y2);
        }else{
          var dx = y1 !== y2 ? .5 : 0;
          var dy = x1 !== x2 ? .5 : 0;

          g.moveTo(x1 + dx, y1 + dy);
          g.lineTo(x2 + dx, y2 + dy);

          if(concaveMode){
            if(x1 < x2 || y1 < y2)
              g.fillRect(x2, y2, 1, 1);
          }
        }

        x1 = x2;
        y1 = y2;
      }while((i += 3) < q.length);

      if(concaveMode)
        g.fillStyle = fillStyle;
    }

    resetTransform(resetScale=1){
      if(resetScale)
        this.s = 1;
      
      this.tx = 0;
      this.ty = 0;
      this.rot = 0;

      this.g.resetTransform();
    }

    scale(s){
      this.s *= s;
    }

    translate(x, y){
      this.tx += this.s * x;
      this.ty += this.s * y;
    }

    rotate(x, y, angle){
      this.rot = angle;

      if(angle){
        this.rtx = x;
        this.rty = y;
        this.rcos = Math.cos(angle);
        this.rsin = -Math.sin(angle);
      }
    }

    rect(x, y, w, h){
      var s1 = 1 / this.s;

      this.moveTo(x, y);
      this.lineTo(x + w + s1, y);

      this.moveTo(x + w, y);
      this.lineTo(x + w, y + h + s1);

      this.moveTo(x + w + s1, y + h);
      this.lineTo(x, y + h);

      this.moveTo(x, y + h + s1);
      this.lineTo(x, y);
    }

    fillRect(x, y, w, h){
      if(this.rot){
        this.g.beginPath();
        this.rect(x, y, w, h);
        this.fill();
        return;
      }

      this.g.fillRect(Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty), Math.round(w * this.s) + 1, Math.round(h * this.s) + 1);
    }

    moveTo(x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.pointsQueue.push(0, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
    }

    lineTo(x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.pointsQueue.push(1, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
    }

    arc(x, y, r, a1, a2, acw){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;

        a1 = (a1 - this.rot) % O.pi2;
        a2 = (a2 - this.rot) % O.pi2;
      }

      var xx = x * this.s + this.tx + .5;
      var yy = y * this.s + this.ty + .5;
      var rr = r * this.s;
      this.arcsQueue.push(this.pointsQueue.length, xx, yy, rr, a1, a2, acw);

      xx += Math.cos(a2) * rr;
      yy += Math.sin(a2) * rr;
      this.pointsQueue.push(0, xx, yy);
    }

    fillText(text, x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.g.fillText(text, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
    }

    strokeText(text, x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.g.strokeText(text, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
    }

    updateFont(){
      var modifiers = this.fontModifiers;
      var strDelimiter = modifiers.length !== 0 ? ' ' : '';

      this.g.font = `${modifiers}${strDelimiter}${this.fontSize * this.fontScale}px "${this.fontFamily}"`;
    }

    font(size){
      this.fontSize = size;
      this.updateFont();
    }

    scaleFont(scale){
      this.fontScale = scale;
      this.updateFont();
    }

    setFontModifiers(modifiers){
      this.fontModifiers = modifiers;
      this.updateFont();
    }

    removeFontModifiers(){
      this.fontModifiers = '';
      this.updateFont();
    }
  },

  BitStream: class{
    constructor(arr=null, checksum=false){
      this.arr = new Uint8Array(0);
      this.len = 0;
      this.bits = '';

      this.rIndex = 0;
      this.rBits = '';

      this.error = false;

      if(arr != null){
        this.parse([...arr], checksum);
      }
    }

    parse(arr, checksum=false){
      if(checksum){
        if(!this.checkArr(arr)){
          this.error = true;
          arr.length = 0;
        }
      }

      this.arr = Uint8Array.from(arr);
      this.len = this.arr.length;
    }

    checkArr(arr){
      if(arr.length & 31) return false;

      var csum = new Uint8Array(arr.splice(arr.length - 32));

      arr.forEach((byte, index) => {
        var cs = csum[index & 31];
        arr[index] ^= cs ^ this.getIndexValue(index ^ cs, .8);
      });

      var hash = O.sha256(arr);

      arr.forEach((byte, index) => {
        arr[index] = byte - this.getIndexValue(index, .9) & 255;
      });

      hash.forEach((byte, index) => {
        csum[index] ^= byte;
      });

      if(csum.some(byte => byte)) return false;
      return arr;
    }

    writeByte(a){
      if(this.len == this.arr.length) this.arr = new Uint8Array([...this.arr, ...Array(this.len || 1)]);
      this.arr[this.len++] = a;
    }

    writeBits(a){
      this.bits += a;

      while(this.bits.length >= 8){
        a = this.bits.substring(0, 8);
        this.bits = this.bits.substring(8);
        this.writeByte(parseInt(a, 2));
      }
    }

    writeBit(a){
      this.write(a, 1);
    }

    write(a, b=null){
      if(b == null) b = (1 << O.binLen(a)) - 1;

      b = b.toString(2);
      a = a.toString(2).padStart(b.length, '0');

      var eq = true;

      a = [...a].filter((v, i) => {
        if(!eq) return true;
        if(!+b[i]) return false;
        if(!+v) eq = false;
        return true;
      }).join('');

      this.writeBits(a);
    }

    readByte(a){
      if(this.rIndex == this.arr.length) return 0;
      return this.arr[this.rIndex++];
    }

    readBits(a){
      var bits = '';

      while(this.rBits.length < a) this.rBits += this.readByte().toString(2).padStart(8, '0');

      bits = this.rBits.substring(0, a);
      this.rBits = this.rBits.substring(a);

      return bits;
    }

    readBit(){
      return this.read(1);
    }

    read(b = 255){
      var a;

      a = this.readBits(O.binLen(b));
      b = b.toString(2);

      var eq = true;
      var i = 0;

      b = [...b].map(v => {
        if(!eq) return a[i++];
        if(!+v) return 0;
        if(!+a[i]) eq = false;
        return +a[i++];
      }).join('');

      this.rBits = a.substring(i) + this.rBits;

      return parseInt(b, 2);
    }

    getIndexValue(index, exp){
      var str = ((index + 256) ** exp).toExponential();
      return str.substring(2, 5) & 255;
    }

    pack(){
      if(this.bits) this.writeBits('0'.repeat(8 - this.bits.length));
    }

    getArr(checksum=false){
      var arr = O.ca(this.len + !!this.bits, i => {
        if(i < this.len) return this.arr[i];
        return parseInt(this.bits.padEnd(8, '0'), 2);
      });

      if(!checksum) return arr;

      while(arr.length & 31){
        arr.push(0);
      }

      arr.forEach((byte, index) => {
        arr[index] = byte + this.getIndexValue(index, .9) & 255;
      });

      var csum = O.sha256(arr);

      arr.forEach((byte, index) => {
        var cs = csum[index & 31];
        arr[index] ^= cs ^ this.getIndexValue(index ^ cs, .8);
      });

      return [...arr, ...csum];
    }

    stringify(checksum=false){
      var arr = this.getArr(checksum);

      return arr.map((byte, index) => {
        var newLine = index != arr.length - 1 && !(index + 1 & 31);
        var byteStr = byte.toString(16).toUpperCase().padStart(2, '0');

        return `${byteStr}${newLine ? '\n' : ''}`;
      }).join('');
    }
  },

  IntStream: class{
    constructor(d=null){
      if(d === null) d = 0n;
      else if(typeof d === 'number') d = BigInt(d);
      else if(typeof d === 'string') d = BigInt(d);
      else if(Array.isArray(d)) d = O.IntStream.parse(d);

      this.d = d;
      this.multiplier = 1n;
    }

    static parse(arr){
      var len = BigInt(arr.length);
      var d = 0n;

      for(var i = 0n; i !== len; i++)
        d += (1n << (i << 3n)) * BigInt(arr[i]);

      return d;
    }

    hasMore(){
      return this.d !== 0n;
    }

    read(base, modify=1, toInt=1){
      base = BigInt(base);
      var val = this.d % base;
      if(modify) this.d /= base;
      if(toInt) val = Number(val);
      return val;
    }

    write(base, val){
      this.d += this.multiplier * BigInt(val);
      this.multiplier *= BigInt(base);
    }

    pack(){
      var {d} = this;
      var arr = [];

      while(d !== 0n){
        var val = Number(d & 255n);
        arr.push(val);
        d >>= 8n;
      }

      return arr;
    }
  },

  Buffer: class extends Uint8Array{
    constructor(...params){
      if(params.length === 1 && typeof params[0] === 'string')
        params[0] = [...params[0]].map(a => O.cc(a));

      super(...params);
    }

    static alloc(size){
      return new O.Buffer(size);
    }

    static from(data, encoding){
      if(data.length === 0)
        return O.Buffer.alloc(0);

      switch(encoding){
        case 'hex':
          data = data.match(/[0-9a-f]{2}/gi).map(a => parseInt(a, 16));
          return new O.Buffer(data);
          break;

        default:
          return new O.Buffer(data);
          break;
      }
    }

    static concat(arr){
      arr = arr.reduce((concatenated, buff) => {
        return [...concatenated, ...buff];
      }, []);

      return new O.Buffer(arr);
    }

    toString(encoding){
      var arr = [...this];

      switch(encoding){
        case 'hex':
          return arr.map(a => a.toString(16).padStart(2, '0')).join('');
          break;

        default:
          return arr.map(a => String.fromCharCode(a)).join('');
          break;
      }
    }

    readUInt32BE(offset){
      var val;

      val = this[offset] * 2 ** 24;
      val += this[offset + 1] * 2 ** 16;
      val += this[offset + 2] * 2 ** 8;
      val += this[offset + 3];

      return val;
    }

    writeUInt32BE(val, offset){
      this[offset] = val / 2 ** 24;
      this[offset + 1] = val / 2 ** 16;
      this[offset + 2] = val / 2 ** 8;
      this[offset + 3] = val;
    }

    writeInt32BE(val, offset){
      this[offset] = val >> 24;
      this[offset + 1] = val >> 16;
      this[offset + 2] = val >> 8;
      this[offset + 3] = val;
    }
  },

  Storage: class{
    constructor(obj=null, path=null, prefix=null){
      if(obj === null) obj = O.obj();

      this.obj = obj;
      this.prefix = prefix;

      if(path !== null){
        var obj1 = this.get(path);

        if(!this.isObj(obj1)){
          obj1 = O.obj();
          this.set(path, obj1);
        }

        this.obj = obj1;
      }
    }

    reset(){
      const {obj} = this;

      for(var key of O.keys(obj))
        if(this.isOwnKey(key))
          delete obj[key];
    }

    has(path){
      var {obj} = this;

      return this.iterPath(path, key => {
        if(!(key in obj)) return;
        obj = obj[key];
        return 1;
      });
    }

    get(path, defaultVal=null){
      var {obj} = this;

      var found = this.iterPath(path, key => {
        if(!(key in obj)) return;
        obj = obj[key];
        return 1;
      });

      if(!found) return defaultVal;
      return obj;
    }

    set(path, val){
      var {obj} = this;
      var last;

      this.iterPath(path, (key, index, arr) => {
        if(index === arr.length - 1){
          last = key;
          return 1;
        }

        if(!this.isObj(obj[key])) obj[key] = O.obj();
        obj = obj[key];
        return 1;
      });

      obj[last] = val;
    }

    remove(path){
      var {obj} = this;
      var last;

      var found = this.iterPath(path, (key, index, arr) => {
        if(index === arr.length - 1){
          last = key;
          return 1;
        }

        if(!(key in obj)) return;
        obj = obj[key];
        return 1;
      });

      if(!found) return;
      delete obj[last];
    }

    iterPath(path, func){
      return path.split('.').every((key, index, arr) => {
        if(index === 0) key = this.format(key);
        return func(key, index, arr);
      });
    }

    format(key){
      const {prefix} = this;

      if(prefix === null) return key;
      return `${prefix}_${key}`;
    }

    isOwnKey(key){
      const {prefix} = this;

      if(prefix === null) return 1;
      return key.startsWith(`${prefix}_`);
    }

    isObj(val){
      return typeof val === 'object' && val !== null;
    }
  },

  /*
    Algorithms
  */

  findPathAStar(grid, x1, y1, x2, y2){
    if(x1 == x2 && y1 == y2) return [];

    grid.iterate((x, y, d) => {
      d.visited = x == x1 && y == y1;
      d.heuristicDist = Math.abs(x - x2) + Math.abs(y - y2);
      d.pathDist = 0;
      d.totalDist = d.heuristicDist;
      d.dir = -1;
    });

    var {w, h} = grid;
    var distStep = 10;
    var nodes = [x1, y1];
    var x, y, dist, dir, i;
    var d1, d2;

    while(1){
      if(!nodes.length) return null;
      [x, y] = [nodes.shift(), nodes.shift()];
      if(Math.abs(x - x2) + Math.abs(y - y2) == 1) break;
      d1 = grid[x][y];

      if(y) visit(x, y - 1, 0);
      if(x) visit(x - 1, y, 1);
      if(y < h - 1) visit(x, y + 1, 2);
      if(x < w - 1) visit(x + 1, y, 3);
    }

    var path = [];
    if(y > y2) path.push(0);
    else if(x > x2) path.push(1);
    else if(y < y2) path.push(2);
    else path.push(3);

    while(1){
      if(x == x1 && y == y1) break;
      dir = grid[x][y].dir;
      path.unshift(dir);
      if(!dir) y++;
      else if(dir == 1) x++;
      else if(dir == 2) y--;
      else x--;
    }

    return path;

    function visit(xx, yy, dir){
      d2 = grid[xx][yy];
      if(d2.wall) return;
      dist = d2.heuristicDist + d1.pathDist + distStep;

      if(!d2.visited || d2.totalDist > dist){
        d2.visited = true;
        d2.pathDist = d1.pathDist + distStep;
        d2.totalDist = dist;
        d2.dir = dir;
        for(i = 0; i < nodes.length; i += 2) if(grid[nodes[i]][nodes[i + 1]].totalDist > dist) break;
        nodes.splice(i, 0, xx, yy);
      }
    }
  },
  
  sha256: (() => {
    const MAX_UINT = 2 ** 32;

    var hhBase = null;
    var kkBase = null;

    return sha256;

    function sha256(buff){
      if(!(buff instanceof O.Buffer))
        buff = new O.Buffer(buff);

      if(hhBase === null){
        hhBase = getArrH();
        kkBase = getArrK();
      }

      const hh = hhBase.slice();
      const kk = kkBase.slice();
      const w = new Uint32Array(64);

      getChunks(buff).forEach(chunk => {
        for(var i = 0; i !== 16; i++){
          w[i] = chunk.readUInt32BE(i << 2);
        }

        for(var i = 16; i !== 64; i++){
          var s0 = (rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3)) | 0;
          var s1 = (rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10)) | 0;

          w[i] = w[i - 16] + w[i - 7] + s0 + s1 | 0;
        }

        var [a, b, c, d, e, f, g, h] = hh;

        for(var i = 0; i !== 64; i++){
          var s1 = (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) | 0;
          var ch = ((e & f) ^ (~e & g)) | 0;
          var temp1 = (h + s1 + ch + kk[i] + w[i]) | 0;
          var s0 = (rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) | 0;
          var maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
          var temp2 = (s0 + maj) | 0;

          h = g | 0;
          g = f | 0;
          f = e | 0;
          e = d + temp1 | 0;
          d = c | 0;
          c = b | 0;
          b = a | 0;
          a = temp1 + temp2 | 0;
        }

        [a, b, c, d, e, f, g, h].forEach((a, i) => {
          hh[i] = hh[i] + a | 0;
        });
      });

      return computeDigest(hh);
    }

    function getArrH(){
      var arr = firstNPrimes(8);

      arrPow(arr, 1 / 2);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getArrK(){
      var arr = firstNPrimes(64);

      arrPow(arr, 1 / 3);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getChunks(buff){
      var bits = buffToBits(buff);
      var len = bits.length;
      var k = getVarK(len);

      bits += '1' + '0'.repeat(k);

      var buffL = O.Buffer.alloc(8);
      buffL.writeUInt32BE(len / MAX_UINT, 0);
      buffL.writeUInt32BE(len % MAX_UINT, 4);

      bits += buffToBits(buffL);

      var chunks = (bits.match(/.{512}/g) || []).map(a => {
        return bitsToBuff(a);
      });

      return chunks;
    }

    function getVarK(len){
      for(var i = 0; i < 512; i++){
        if(!((len + i + 65) % 512)) return i;
      }
    }

    function computeDigest(a){
      var arr = [];
      var buff = O.Buffer.alloc(4);

      a.forEach(a => {
        buff.writeUInt32BE(a, 0);
        arr.push(buff[0], buff[1], buff[2], buff[3]);
      });

      return O.Buffer.from(arr);
    }

    function rot(a, b){
      return (a >>> b) | (a << 32 - b);
    }

    function arrPow(arr, pow){
      arr.forEach((a, i) => {
        a **= pow;
        arr[i] = a;
      });
    }

    function arrFrac(arr, bitsNum = 32){
      arr.forEach((a, i) => {
        a = a % 1 * 2 ** bitsNum;

        var bits = O.ca(bitsNum, i => {
          return !!(a & (1 << (bitsNum - i - 1))) | 0;
        }).join('');

        a = parseInt(bits, 2);

        arr[i] = a;
      });
    }

    function buffToBits(buff){
      return [...buff].map(byte => {
        return byte.toString(2).padStart(8, '0');
      }).join('');
    }

    function bitsToBuff(bits){
      return O.Buffer.from((bits.match(/\d{8}/g) || []).map(a => {
        return parseInt(a, 2);
      }));
    }

    function firstNPrimes(a){
      return O.ca(a, i => nthPrime(i + 1));
    }

    function nthPrime(a){
      for(var i = 1; a; i++){
        if(isPrime(i)) a--;
      }

      return i - 1;
    }

    function isPrime(a){
      if(a == 1) return false;

      for(var i = 2; i < a; i++){
        if(!(a % i)) return false;
      }

      return true;
    }
  })(),

  /*
    Function that does nothing
  */

  nop(){}
};

O.init(0);

module.exports = O;