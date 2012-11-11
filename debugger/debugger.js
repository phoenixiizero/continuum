(function(global, Realm, constants, utility, debug){
var inherit = utility.inherit,
    create = utility.create,
    assign = utility.assign,
    define = utility.define,
    isObject = utility.isObject;




function _(s){
  return document.createElement(s);
}


var eventOptions = { bubbles: true, cancelable: true },
    noBubbleEventOptions = { bubbles: false, cancelable: true },
    min = Math.min,
    max = Math.max;


if ('getComputedStyle' in window) {
  var getComputedStyle = window.getComputedStyle;
} else {
  var getComputedStyle = function(el){
    return el.currentStyle;
  };
}

var scrollbarWidth = (function(d, b, e, s) {
  b = d.body;
  e = b.appendChild(_('div'));
  (s = e.style).height = s.width = '50px';
  s.overflowX = 'scroll';
  e.appendChild(_('div')).style.width = '100px';
  s = e.offsetHeight - e.clientHeight;
  b.removeChild(e);
  e = null;
  return s;
})(document);


function forward(o, from, to){
  Object.defineProperty(o, to, {
    configurable: true,
    get: function(){ return this[from] },
    set: function(v){ this[from] = v }
  });
  return o;
}

try {
  new global.Event('test');
  var Event = global.Event;
}
catch (e) {
  var Event = (function(E){
    function EventInit(type, o){
      if (o)
        for (var k in this)
          if (k in o)
            this[k] = o[k];
      if (type)
        this.type = type;
    }

    EventInit.prototype = assign(create(null), { bubbles: true, cancelable: true, type: '' });


    if ('createEvent' in document) {
      var Event = (function(){
        function Event(type, dict){
          dict = new EventInit(type, dict);
          var evt = document.createEvent('Event');
          evt.initEvent(dict.type, dict.bubbles, dict.cancelable);
          return evt;
        }
        return Event;
      })();
    } else {
      var Event = (function(){
        function Event(type, dict){
          var evt = document.createEventObject();
          dict = new EventInit(type, dict);
          dict.cancelBubble = dict.bubbles;
          for (var k in dict) {
            evt[k] = dict[k];
          }
          return evt;
        }

        function preventDefault(){
          this.returnValue = false;
        }

        define(E.prototype, preventDefault);

        forward(E.prototype, 'screenX', 'pageX');
        forward(E.prototype, 'screenY', 'pageY');

        return Event;
      })();
    }

    Event.prototype = E.prototype;
    define(Event.prototype, 'constructor', Event);

    return Event;
  })(global.Event);
}



function Component(tag){
  if (typeof tag === 'string') {
    this.element = _(tag);
  } else {
    this.element = tag;
  }
  if (this.element.classList) {
    this.classes = this.element.classList;
  }
  this.styles = this.element.style;
  this.element.component = this;
}

define(Component.prototype, {
  ns: 'ƒ'
});

void function(){
  define(Component.prototype, [
    function append(subject){
      if (!subject) return subject;
      if (subject.element) {
        this.children || (this.children = []);
        this.children.push(subject);
        this.element.appendChild(subject.element);
      } else if (subject instanceof Element) {
        this.element.appendChild(subject);
      }
      return subject;
    },
    function insert(subject, before){
      if (!this.children) {
        return this.append(subject);
      }
      if (subject instanceof Element) {
        subject = new Component(subject);
      }
      var index = this.children.indexOf(before);
      if (~index) {
        this.children.splice(index, 0, subject);
        this.element.insertBefore(subject.element, before.element);
      }
    },
    function remove(subject){
      if (subject === undefined) {
        this.element.parentNode.removeChild(this.element);
      } else {
        if (subject.element) {
          subject = subject.element;
        }
        if (subject && subject.parentNode) {
          if (subject.parentNode === this.element) {
            this.element.removeChild(subject);
          }
        } else if (subject === this.element.parentNode) {
          subject.removeChild(this.element);
        } else {
          console.dir(subject);
        }
      }
    },
    function replace(child, replacement){
      if (this.children) {
        return false;
      }
      if (replacement instanceof Element) {
        replacement = new Component(replacement);
      }
      var index = this.children.indexOf(child);
      if (~index) {
        this.children.splice(index, 1, replacement);
        this.element.insertBefore(replacement.element, child.element);
        this.element.removeChild(child.element);
      }
    },
    function width(value){
      if (value === undefined) {
        return this.element.offsetWidth;
      } else {
        this.styles.width = value + 'px';
      }
    },
    function height(value){
      if (value === undefined) {
        return this.element.offsetHeight;
      } else {
        this.styles.height = value + 'px';
      }
    },
    function left(value){
      if (value === undefined) {
        return this.element.getBoundingClientRect().left;
      } else {
        this.styles.left = value + 'px';
      }
    },
    function right(value){
      if (value === undefined) {
        return this.element.getBoundingClientRect().right;
      } else {
        this.styles.right = value + 'px';
      }
    },
    function top(value){
      if (value === undefined) {
        return this.element.getBoundingClientRect().top;
      } else {
        this.styles.top = value + 'px';
      }
    },
    function bottom(value){
      if (value === undefined) {
        return this.element.getBoundingClientRect().bottom;
      } else {
        this.styles.bottom = value + 'px';
      }
    },
    function bounds(){
      return this.element.getBoundingClientRect();
    },
    function getMetric(name){
      var v = this.getComputed(name);
      return v === 'auto' ? 0 : parseFloat(v);
    },
    function getComputed(name){
      if (!this.computedStyles) {
        this.computedStyles = getComputedStyle(this.element);
      }
      return this.computedStyles[name];
    },
    function offset(){
      return {
        left: this.element.offsetLeft + this.getMetric('marginLeft'),
        top: this.element.offsetTop + this.getMetric('marginTop')
      }
    },
    function clear(){
      this.innerHTML = '';
    },
    function hide(){
      this.element.style.display = 'none';
    },
    function show(){
      this.element.style.display = '';
    },
    function parent(){
      var node = this.element.parentNode;
      if (node) {
        if (!node.component) {
          return new Component(node);
        } else {
          return node.component;
        }
      }
    },
    function style(name, val){
      if (typeof name === 'string') {
        if (typeof val === 'number') {
          val += 'px';
        }
        this.element.style[name] = val;
      } else {
        for (var k in name) {
          var val = name[k];
          if (typeof val === 'number') {
            val += 'px';
          }
          this.element.style[k] = val;
        }
      }
    },
    function child(){
      var el = this.element.firstChild;
      if (el && el.component) {
        return el.component;
      } else if (el) {
        return new Component(el);
      }
    }
  ]);
}();

if (document.body.classList) {
  void function(){
    define(Component.prototype, [
      function addClass(name, noNS){
        if (!noNS) name = this.ns+name;
        return this.classes.add(name);
      },
      function removeClass(name, noNS){
        if (!noNS) name = this.ns+name;
        return this.classes.remove(name);
      },
      function toggleClass(name, noNS){
        if (!noNS) name = this.ns+name;
        return this.classes.toggle(name);
      },
      function hasClass(name, noNS){
        if (!noNS) name = this.ns+name;
        return this.classes.contains(name);
      }
    ]);
  }();
} else {
  void function(cache){
    function matcher(n){
      if (!(n in cache)) {
        cache[n] = new RegExp('(.*)(?:^'+n+'\\s|\\s'+n+'$|\\s'+n+'\\s)(.*)');
      }
      return cache[n];
    }

    define(Component.prototype, [
      function addClass(name, noNS){
      if (!noNS) name = this.ns+name;
        var className = this.element.className;
        if (!matcher(name).test(className)) {
          this.element.className = className + ' ' + name;
        }
        return this;
      },
      function removeClass(name, noNS){
      if (!noNS) name = this.ns+name;
        var p = this.element.className.match(matcher(name));
        if (p) {
          this.element.className = p[1] ? p[2] ? p[1]+' '+p[2] : p[1] : p[2];
        }
        return this;
      },
      function toggleClass(name, noNS){
      if (!noNS) name = this.ns+name;
        if (this.hasClass(name)) {
          this.removeClass(name);
        } else {
          this.addClass(name);
        }
        return this;
      },
      function hasClass(name, noNS){
      if (!noNS) name = this.ns+name;
        return matcher(name).test(this.element.className);
      }
    ]);
  }(create(null));
}


if ('dispatchEvent' in document.body) {
  void function(){
    define(Component.prototype, [
      function on(event, listener, receiver){
        if (typeof listener !== 'function') {
          for (var k in listener) {
            this.on(k, listener[k], receiver)
          }
          return this;
        }

        receiver || (receiver = this);

        function bound(e){
          return listener.call(receiver, e);
        }

        define(listener, bound);
        this.element.addEventListener(event, bound, false);
        return this;
      },
      function off(event, listener){
        this.element.removeEventListener(event, listener.bound, false);
        delete listener.bound;
        return this;
      },
      function once(event, listener, receiver){
        receiver = receiver || this;

        function bound(e){
          this.removeEventListener(event, bound, false);
          return listener.call(receiver, e);
        }

        this.element.addEventListener(event, bound, false);
        return this;
      },
      function emit(event, data){
        if (typeof event === 'string') {
          var opts = data && data.bubbles === false ? noBubbleEventOptions : eventOptions;
          event = new Event(event, opts);
        }
        if (data) {
          for (var k in data) {
            if (k !== 'bubbles') {
              event[k] = data[k];
            }
          }
        }
        return this.element.dispatchEvent(event);
      }
    ]);
  }();
} else {
  void function(){
    var realEvents = create(null);
    utility.iterate([
      'activate', 'afterupdate', 'beforeactivate', 'beforecopy', 'beforecut', 'beforedeactivate', 'beforeeditfocus',
      'beforepaste', 'beforeupdate', 'blur', 'cellchange', 'click', 'contextmenu', 'controlselect', 'copy',
      'dataavailable', 'datasetchanged', 'datasetcomplete', 'dblclick', 'deactivate', 'drag', 'dragend', 'dragenter',
      'dragleave', 'dragover', 'dragstart', 'drop', 'errorupdate', 'filterchange', 'focus', 'focusin', 'focusout',
      'help', 'keydown', 'keyup', 'losecapture', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout',
      'mouseup', 'mousewheel', 'move', 'moveend', 'movestart', 'paste', 'propertychange', 'readystatechange', 'resize',
      'resizeend', 'resizestart', 'rowenter', 'rowexit', 'rowsdelete', 'rowsinserted', 'scroll', 'selectstart'
    ], function(name){ realEvents[name] = true });

    define(Component.prototype, [
      function on(event, listener, receiver){
        if (typeof listener !== 'function') {
          for (var k in listener) {
            this.on(k, listener[k], receiver)
          }
          return this;
        }

        receiver || (receiver = this);

        var real = event in realEvents;

        if (real) {
          var bound = function(e){
            return listener.call(receiver, e);
          };
        } else {
          var bound = function(e){
            e = e.srcElement.customEvent;
            if (e && !e.expired && e.type === event) {
              return listener.call(receiver, e);
            }
          };
        }

        define(listener, 'bound', bound);
        if (real) {
          this.element.attachEvent('on'+event, bound);
        } else {
          this.element.attachEvent('onpropertychange', bound);
        }
        return this;
      },
      function off(event, listener){
        event = event in realEvents ? event : 'propertychange';
        this.element.detachEvent('on'+event, listener.bound);
        delete listener.bound;
        return this;
      },
      function once(event, listener, receiver){
        function one(e){
          this.off(event, one);
          return listener.call(receiver, e);
        }
        this.on(event, one, this);
        return this;
      },
      function emit(event, data){
        if (typeof event === 'string') {
          var opts = data && data.bubbles === false ? noBubbleEventOptions : eventOptions;
          event = new Event(event, opts);
        }

        if (data) {
          for (var k in data) {
            event[k] = data[k];
          }
        }

        if (event in realEvents) {
          return this.element.fireEvent(event);
        } else {
          this.element.customEvent = event;
          console.dir(event);
          event.expired = true;
          return event.returnValue === undefined ? true : event.returnValue;
        }
      }
    ]);
  }();
}


if ('textContent' in document.body) {
  void function(){
    define(Component.prototype, [
      function text(value){
        if (value === undefined) {
          return this.element.textContent;
        } else {
          this.element.textContent = value;
          return this;
        }
      }
    ]);
  }();
} else {
  void function(){
    define(Component.prototype, [
      function text(value){
        if (value === undefined) {
          return this.element.innerText;
        } else {
          this.element.innerText = value;
          return this;
        }
      }
    ]);
  }();
}


var Span = (function(){
  function Span(text, name){
    Component.call(this, 'span');
    this.name = name;
    this.text(text);
    if (name) {
      this.addClass(name);
    }
  }

  inherit(Span, Component, []);

  return Span;
})();

var Div = (function(){
  function Div(text, name){
    Component.call(this, 'div');
    if (text && text[0] === '.') {
      name = text.slice(1);
      text = '';
    }
    this.name = name;
    text && this.text(text);
    name && this.addClass(name);
  }

  inherit(Div, Component, []);

  return Div;
})();


var Button = (function(){
  function Button(text, name){
    Component.call(this, 'button');
    this.addClass('button');
    if (name) {
      this.addClass(name);
    }
    this.face = this.append(new Div(text, 'button-text'));
  }

  inherit(Button, Component, [
    function text(value){
      return this.face.text(value);
    }
  ]);

  return Button;
})();


var VerticalScrollbar = function(){
  function VerticalScrollbar(container){
    var self = this;
    Component.call(this, 'div');
    this.addClass('scroll');
    this.track = this.append(new Div('.scroll-track'));
    this.thumb = this.track.append(new Div('.scroll-thumb'));
    this.up = this.append(new Div('.scroll-top'));
    this.down = this.append(new Div('.scroll-bottom'));

    if (container instanceof Element) {
      container = new Component(container);
    }
    var parent = container.parent();

    parent.right(-scrollbarWidth);
    var oldWidth = parent.width;

    parent.width = function(value){
      if (value === undefined) {
        return oldWidth.call(parent) - scrollbarWidth;
      } else {
        oldWidth.call(parent, value + scrollbarWidth + 2);
      }
    };

    container.resize = function(){
      this.scrollbar.refresh();
    };

    parent.style('overflowX', 'hidden');
    container.style({
      paddingRight: container.getMetric('paddingRight') + scrollbarWidth,
      overflowY: 'auto'
    });
    parent.addClass('scroll-container');
    container.addClass('scrolled');
    this.container = container;
    container.append(this);
    container.scrollbar = this;
    container.on('scroll', this.refresh, this);
    container.on('click', this.refresh, this);


    this.dragger = new Dragger(this.thumb, {
      grab: function(e){
        var el = self.container.element;
        self.thumb.addClass('scrolling');
        self.start = el.scrollTop * el.clientHeight - el.scrollHeight * e.clientY;
      },
      drag: function(e){
        var el = self.container.element;
        el.scrollTop = (self.start + el.scrollHeight * e.clientY) / el.clientHeight;
      },
      drop: function(e){
        self.thumb.removeClass('scrolling');
      }
    });
    this.dragger.addClass('pointer');


    this.down.on('mousedown', function(e){
      self.repeat(.005, 15);
      this.addClass('scrolling');
      e.preventDefault();
    });

    this.up.on('mousedown', function(e){
      self.repeat(-.005, 15);
      this.addClass('scrolling');
      e.preventDefault();
    });

    this.track.on('mousedown', function(e){
      var compare = e.pageY > self.thumb.bottom() ? 1 : e.pageY < self.thumb.top() ? -1 : 0;
      if (compare) {
        this.addClass('scrolling');
        self.repeat(compare * .1, 300);
      }
      e.preventDefault();
    });

    this.on('scroll-end', function(){
      this.track.removeClass('scrolling');
      this.down.removeClass('scrolling');
      this.up.removeClass('scrolling');
    });
  }

  inherit(VerticalScrollbar, Component, [
    function repeat(amount, speed){
      var self = this;
      speed = speed || 300;
      self.repeating = true;

      body.once('mouseup', function(){
        if (self.repeating) {
          self.repeating = false;
          self.emit('scroll-end')
        }
      });

      body.once('click', function(){
        if (self.repeating) {
          self.repeating = false;
          self.emit('scroll-end')
        }
      });

      function loop(){
        if (self.repeating) {
          var percent = max(min(self.percent() + amount, 1), 0);
          self.percent(percent);
          if (percent !== 1 && percent !== 0) {
            setTimeout(loop, speed);
          } else if (self.repeating) {
            self.repeating = false;
            self.emit('scroll-end');
          }
        }
      }

      setTimeout(loop, 100);
    },
    function scrollHeight(){
      return this.container.element.scrollHeight - this.container.element.clientHeight;
    },
    function percent(val){
      var el = this.container.element;
      if (val === undefined) {
        return (el.scrollTop + el.clientHeight) / el.scrollHeight;
      } else {
        el.scrollTop = val * el.scrollHeight - el.clientHeight;
      }
    },
    function scrollRelative(percent){
      this.percent(this.percent() + percent);
    },
    function resize(){
      this.refresh();
    },
    function thumbTop(){
      var el = this.container.element;
      return el.scrollTop / el.scrollHeight * this.track.height() + .5 | 0;
    },
    function thumbBottom(){
      var el = this.container.element,
          height = this.track.height();
      return height - (el.clientHeight + el.scrollTop) / el.scrollHeight * height + .5 | 0;
    },
    function trackHeight(){
      var self = this;
      if (!this._trackHeight) {
        this._trackHeight = this.track.height();
        setTimeout(function(){
          this._trackHeight = 0;
        }, 10);
      }
      return this._trackHeight;
    },
    function scale(value){
      var el = this.container.element;
      return value / el.scrollHeight * this.trackHeight() + .5 | 0;
    },
    function refresh(){
      var top = this.thumbTop(),
          bottom = this.thumbBottom();

      this.thumb.top(top);
      this.thumb.bottom(bottom);
      if (!this.disabled && !top && !bottom) {
        this.disabled = true;
        this.addClass('disabled');
      } else if (this.disabled && top || bottom) {
        this.disabled = false;
        this.removeClass('disabled');
      }
    }
  ]);

  return VerticalScrollbar;
}();


var Panel = function(){
  function PanelOptions(o){
    o = Object(o);
    for (var k in this) {
      if (k in o) {
        this[k] = o[k];
      }
    }
  }

  PanelOptions.prototype = {
    size: 'auto',
    splitter: true,
    name: null,
    label: null,
    left: null,
    top: null,
    right: null,
    bottom: null,
    content: null,
    scroll: null
  };

  function Panel(parent, options){
    var self = this;
    Component.call(this, 'div');
    options = new PanelOptions(options);

    if (options.label) {
      var label = new Component('h2');
      label.text(options.label);
      label.addClass('panel-label');
      this.append(label);
    }

    if (options.name) {
      this.name = options.name;
      this.element.id = options.name;
    }

    this.addClass('panel');

    if (parent) {
      this._parent = parent;
      this.size = options.size;
    } else {
      this._parent = null;
      this.addClass('root');
    }


    function append(side){
      self[side] = Panel.from(self, options[side]);
      self[side].anchor = side;
      self.append(self[side]);
      self[side].addClass(side);
      return self[side];
    }

    if (options.content) {
      if (options.content instanceof Element) {
        this.content = new Component(options.content);
      } else if (options.content instanceof Component) {
        this.content = options.content;
      }
      this.append(this.content);
    } else {
       if (options.left || options.right) {
        this.orient = 'horizontal';
        var first = append('left'),
            second = append('right');
      } else if (options.top || options.bottom) {
        this.orient = 'vertical';
        var first = append('top'),
            second = append('bottom');
      } else {
        throw new Error('invalid options');
      }

      this.addClass(this.orient);
      if (options.splitter) {
        this.splitter = new Splitter(first, second, this.orient);
      }
    }

    if (!parent) {
      var update = function(){
        //var rect = self.bounds();
        self.calcWidth = self.element.clientWidth;
        self.calcHeight = self.element.clientHeight;
        self.recalc();
        self.resize();
      };

      win.on('resize', update);
      body.append(this.element);
      this.size = 1;
      update();
    }

    if (options.scroll && this.content) {
      this.scrollbar = new VerticalScrollbar(this.content);
    }
  }


  function length(value, container){
    if (value >= -1 && value <= 1) {
      return value * container;
    } else {
      return value;
    }
  }


  define(Panel, [
    function from(parent, obj){
      if (obj instanceof Panel) {
        return obj;
      } else if (obj && typeof obj === 'object') {
        return new Panel(parent, obj);
      }
    }
  ]);


  inherit(Panel, Component, [
    function resize(){
      if (this.content) {
        //this.content.width(this.content.calcWidth);
        this.content.height(this.content.calcHeight);
        this.content.resize && this.content.resize();
      } else if (this.orient === 'vertical') {
        this.top.height(this.top.calcHeight);
        this.top.resize && this.top.resize();
        this.bottom.height(this.bottom.calcHeight);
        this.bottom.resize && this.bottom.resize();
      } else if (this.orient === 'horizontal') {
        this.left.width(this.left.calcWidth);
        this.left.resize && this.left.resize();
        this.right.width(this.right.calcWidth);
        this.right.resize && this.right.resize();
      }
    },
    function recalc(){
      if (this.content) {
        this.content.calcWidth = this.calcWidth;
        this.content.calcHeight = this.calcHeight;
        this.content.recalc && this.content.recalc();
      } else {
        if (this.orient === 'vertical') {
          var first = 'top',
              second = 'bottom',
              main = 'calcHeight',
              cross = 'calcWidth';
        } else {
          var first = 'left',
              second = 'right',
              main = 'calcWidth',
              cross = 'calcHeight';
        }

        if (this[first] && this[second]) {
          this[first][cross] = this[second][cross] = this[cross];
          if (this[first].size === 'auto' && this[second].size === 'auto') {
            this[first][main] = this[second][main] = this[main] / 2 + .5 | 0;
          } else {
            if (this[first].size === 'auto') {
              var primary = this[second];
                  second = this[first];
            } else {
              var primary = this[first];
                  second = this[second];
            }
            primary[main] = length(primary.size, this[main]);
            second[main] = this[main] - primary[main];
          }
          this[first].recalc && this[first].recalc();
          this[second] && this[second].recalc && this[second].recalc();
        }
      }
    }
  ]);

  return Panel;
}();

var Dragger = (function(){
  function Dragger(target, bindings){
    Component.call(this, 'div');
    this.target = target;
    this.addClass('drag-helper');
    target.on('mousedown', this.grab, this);
    this.on('mousemove', this.drag);
    target.on('mouseup', this.drop, this);
    this.on('mouseup', this.drop);
    if (bindings) {
      for (var k in bindings) {
        this.on(k, bindings[k]);
      }
    }
  }

  inherit(Dragger, Component, [
    function grab(e){
      body.append(this);
      this.x = e.pageX;
      this.y = e.pageY;
      this.start = this.target.offset();
      this.emit('grab', {
        x: this.x,
        y: this.x,
        clientX: e.clientX,
        clientY: e.clientY
      });
      e.preventDefault();
    },
    function drag(e){
      this.emit('drag', this.calculate(e));
    },
    function drop(e){
      if (this.element.parentNode) {
        body.remove(this);
        this.emit('drop', this.calculate(e));
      }
    },
    function calculate(e){
      var xDelta = this.x - e.pageX,
          yDelta = this.y - e.pageY;

      return {
        x: e.pageX,
        y: e.pageY,
        clientX: e.clientX,
        clientY: e.clientY,
        xDelta: xDelta,
        yDelta: yDelta,
        xOffset: xDelta + this.start.left,
        yOffset: yDelta + this.start.top
      };
    },
  ]);

  return Dragger;
})();

var Splitter = (function(){
  function Splitter(near, far, orientation){
    if (!(this instanceof splitters[orientation])) {
      return new splitters[orientation](near, far);
    }
    Component.call(this, 'div');
    this.near = near;
    this.far = far;
    this._parent = near._parent;

    this.addClass('splitter');
    this.addClass('splitter-'+orientation);
    this._parent.addClass('splitter-container');
    far.addClass('splitter-side');
    near.addClass('splitter-side');
    far.append(this);

    this.lastNear = this.nearSize();
    this.lastFar = this.parentSize() - this.lastNear;
    this.position(0);

    this.dragger = new Dragger(this);
    this.dragger.on('grab', this.grab, this);
    this.dragger.on('drag', this.drag, this);
    this.dragger.on('drop', this.drop, this);

  }

  inherit(Splitter, Component, [
    function grab(e){
      this.addClass('dragging');
      this.startSize = this.nearSize();
    },
    function drag(e){
      var container = this.parentSize();
      this.set(min(max(this.size(), this.startSize - this.mouseOffset(e)), container), container);
    },
    function drop(e){
      this.removeClass('dragging');
    },
    function render(){
      this.set(this.lastNear, this.parentSize(), true);
    },
    function set(near, container, silent){
      if (this.maximized === -1) {
        if (container < this.lastSize) {
          near = container;
        }
      }

      var far = container - near;

      if (this.lastNear !== near || this.lastFar !== far) {
        this.lastNear = near;
        this.lastFar = far;
        this.near.size = near / container;
        this.far.size = 'auto';
        this._parent.recalc();
        this._parent.resize();
      }
    }
  ]);

  var splitters = {
    vertical: (function(){
      function VerticalSplitter(near, far){
        Splitter.call(this, near, far, 'vertical');
        this.near.addClass('splitter-top');
        this.far.addClass('splitter-bottom');
        this.dragger.addClass('row-resize');
      }

      inherit(VerticalSplitter, Splitter, [
        function nearSize(v){
          return this.near.height(v);
        },
        function farSize(v){
          return this.far.height(v);
        },
        function parentSize(v){
          return this._parent.height(v);
        },
        function size(v){
          return this.height(v);
        },
        function position(v){
          return this.left(v);
        },
        function mouseOffset(e){
          return e.yDelta;
        }
      ]);

      return VerticalSplitter;
    })(),
    horizontal: (function(){
      function HorizontalSplitter(near, far){
        Splitter.call(this, near, far, 'horizontal');
        this.near.addClass('splitter-left');
        this.far.addClass('splitter-right');
        this.dragger.addClass('col-resize');
      }

      inherit(HorizontalSplitter, Splitter, [
        function nearSize(v){
          return this.near.width(v);
        },
        function farSize(v){
          return this.far.width(v);
        },
        function parentSize(v){
          return this._parent.width(v);
        },
        function size(v){
          return this.width(v);
        },
        function position(v){
          return this.top(v);
        },
        function mouseOffset(e){
          return e.xDelta;
        }
      ]);

      return HorizontalSplitter;
    })()
  };

  return Splitter;
})();


var InputBox = (function(){
  function InputBoxOptions(o){
    if (o)
      for (var k in this)
        if (k in o)
          this[k] = o[k];
  }

  InputBoxOptions.prototype = {
    hint: '',
    spellcheck: false,
    'class': 'input',
    tag: 'textarea',
    autofocus: false
  };


  function InputBox(options){
    options = new InputBoxOptions(options);
    Component.call(this, options.tag);
    this.element.spellcheck = options.spellcheck;
    this.addClass(options['class']);

    var keyboard = new Keyboard(this.element),
        self = this;

    this.reset();

    keyboard.on('Enter', 'activate', function(e){
      self.entry();
      e.preventDefault();
    });

    keyboard.on('Up', 'activate', function(e){
      self.previous();
      e.preventDefault();
    });

    keyboard.on('Down', 'activate', function(e){
      self.next();
      e.preventDefault();
    });

    if (options.autofocus) {
      this.element.focus();
    }

    if (options.hint) {
      this.element.value = options.hint;
      this.once('focus', function(e){
        this.element.value = '';
      });
    }
  }

  inherit(InputBox, Component, [
    function entry(){
      var value = this.element.value;
      this.element.value = '';
      if (this.index !== this.items.length) {
        this.items.splice(this.index, 0, value);
      } else {
        this.items.push(value);
      }
      this.index++;
      this.emit('entry', value);
      return this;
    },
    function reset(){
      this.items = [];
      this.index = 0;
      this.element.value = '';
      return this;
    },
    function last(){
      this.index = this.items.length;
      this.element.value = '';
      return this;
    },
    function previous(){
      if (this.items.length) {
        if (this.index === 0) {
          this.last();
        } else {
          this.set('previous', this.items[--this.index]);
        }
      }
      return this;
    },
    function next(){
      if (this.items.length) {
        if (this.index === this.items.length - 1) {
          this.last();
        } else {
          if (this.index === this.items.length) {
            this.index = -1
          }
          this.set('next', this.items[++this.index]);
        }
      }
      return this;
    },
    function set(reason, value){
      if (this.disabled) return;
      this.element.value = value;
      this.emit(reason, value);
      return this;
    },
    function emit(event, value){
      if (this.disabled) return;

      var self = this;
      if (typeof value === 'string')
        value = { value: value };

      setTimeout(function(){
        var evt = new Event(event, { bubbles: true });
        if (value) {
          for (var k in value) {
            evt[k] = value[k];
          }
        }
        self.element.dispatchEvent(evt);
      }, 1);
    },
    function disable(){
      this.element.disabled = true;
      this.disabled = true;
    },
    function enable(){
      this.element.disabled = false;
      this.disabled = false;
    }
  ]);

  return InputBox;
})();



var Editor = (function(commands, Pass){
  var paging = CodeMirror.keyMap.paging = {
    'Enter': function(cm){ cm.editor.entry() },
    'Up': function(cm){ cm.editor.previous() },
    'Down': function(cm){ cm.editor.next() },
    'Ctrl-Up': function(cm){ cm.editor.previous() },
    'Ctrl-Down': function(cm){ cm.editor.next() },
    fallthrough: ['default']
  };

  function cancelPaging(cm){
    cm.setOption('keyMap', 'debug');
    throw Pass;
  }

  utility.iterate(CodeMirror.keyNames, function(name){
    if (!(name in paging)) {
      paging[name] = cancelPaging;
    }
  });

  CodeMirror.keyMap.debug = {
    'Enter': function(cm){
      cm.editor.entry();
    },
    'Up': function(cm){
      if (!cm.getValue() && cm.editor.count) {
        cm.setOption('keyMap', 'paging');
        cm.editor.previous();
      } else {
        commands.goLineUp(cm);
      }
    },
    'Down': function(cm){
      if (!cm.getValue() && cm.editor.count) {
        cm.setOption('keyMap', 'paging');
        cm.editor.next();
      } else {
        commands.goLineDown(cm);
      }
    },
    'Ctrl-Up': function(cm){
      if (cm.editor.count) {
        cm.setOption('keyMap', 'paging');
        cm.editor.previous()
      } else {
        return Pass;
      }
    },
    'Ctrl-Down': function(cm){
      if (cm.editor.count) {
        cm.setOption('keyMap', 'paging');
        cm.editor.next()
      } else {
        return Pass;
      }
    },
    fallthrough: ['default']
  };


  function Editor(options){
    Component.call(this, 'div');
    this.addClass('editor');
    this.codemirror = new CodeMirror(this.element, {
      lineNumbers: true,
      autofocus: true,
      lineWrapping: true,
      smartIndent: true,
      autoClearEmptyLines: false,
      mode: 'javascript',
      keyMap: 'debug',
      tabSize: 2,
      pollInterval: 50
    });
    this.items = [];
    this.index = 0;
    this.count = 0;
    this.codemirror.editor = this;
  }

  inherit(Editor, Component, [
    function resize(){
      this.codemirror.refresh();
    },
    function entry(){
      var value = this.codemirror.getValue();
      this.codemirror.setValue('');
      if (this.index !== this.items.length) {
        this.items.splice(this.index, 0, value);
      } else {
        this.items.push(value);
      }
      this.index++;
      this.count++;
      this.emit('entry', { value: value });
      return this;
    },
    function reset(){
      this.items = [];
      this.index = 0;
      this.count = 0;
      this.codemirror.setValue('');
      return this;
    },
    function last(){
      this.index = this.items.length;
      this.codemirror.setValue('');
      return this;
    },
    function previous(){
      if (this.items.length) {
        if (this.index === 0) {
          this.last();
        } else {
          this.set('previous', this.items[--this.index]);
        }
      }
      return this;
    },
    function next(){
      if (this.items.length) {
        if (this.index === this.items.length - 1) {
          this.last();
        } else {
          if (this.index === this.items.length) {
            this.index = -1
          }
          this.set('next', this.items[++this.index]);
        }
      }
      return this;
    },
    function set(reason, value){
      if (this.disabled) return;
      this.codemirror.setValue(value);
      this.emit(reason, { value: value });
      CodeMirror.commands.goDocEnd(this.codemirror);
      return this;
    },
    function disable(){
      this.codemirror.setOption('readOnly', true);
      this.disabled = true;
    },
    function enable(){
      this.codemirror.setOption('readOnly', false);
      this.disabled = false;
    }
  ]);

  return Editor;
})(CodeMirror.commands, CodeMirror.Pass);



var Console = (function(){
  function Console(){
    Component.call(this, 'div');
    this.console = this.append(new Div('.console'));
  }

  inherit(Console, Component, [
    function clear(){
      this.console.element.innerHTML = '';
    },
    function write(msg, color){
      var node = new Span(msg);
      node.style('color', color === undefined ? 'white' : color);
      this.console.append(node);
    },
    function backspace(count){
      var buffer = this.console.element;
      while (buffer.lastChild && count > 0) {
        var el = buffer.lastChild.component,
            len = el.text().length;
        if (len < count) {
          this.console.remove(el);
          count -= len;
        } else if (len === count) {
          this.console.remove(el);
          return true;
        } else {
          var text = el.element.firstChild;
          text.data = text.data.slice(0, text.data.length - count);
          return true;
        }
      }
    }
  ]);

  return Console;
})();


var Instructions = (function(){
  var typeofs = {
    string: 'StringValue',
    boolean: 'BooleanValue',
    number: 'NumberValue',
    undefined: 'UndefinedValue',
    object: 'NullValue'
  };

  function identity(x){
    return x;
  }

  var translators = {
    string: utility.quotes,
    boolean: identity,
    number: identity,
    undefined: identity,
    object: identity
  };


  function Instruction(instruction, item){
    var op = instruction.op;
    Component.call(this, 'li');
    this.instruction = instruction;
    this.addClass('instruction');
    this.addClass(op.name);
    this.append(new Span(op.name, 'op-name'));
    if (op.name === 'GET' || op.name === 'PUT') {
      if (!isObject(item)) {
        var type = typeof item;
        this.append(new Span(translators[type](item), typeofs[type]));
      } else {
        if (item.Reference) {
          var base = item.base;
          if (base) {
            if (base.bindings && base.bindings.NativeBrand) {
              base = base.bindings;
            }

            if (base.NativeBrand) {
              item = base.properties.get(item.name);
            }
          }
        }
        if (item && item.NativeBrand) {
          var result = renderer.render(item);
          this.append(result);
        }
      }
    } else if (op.name === 'BINARY') {
      this.append(new Span(constants.BINARYOPS.getKey(instruction[0]), 'Operator'));
    } else if (op.name === 'UNARY') {
      this.append(new Span(constants.UNARYOPS.getKey(instruction[0]), 'Operator'));
    } else {
      for (var i=0; i < op.params; i++) {
        var param = instruction[i];
        if (!isObject(param)) {
          this.append(new Span(param, typeofs[typeof param]));
        }
      }
    }
  }

  inherit(Instruction, Component, []);


  function Instructions(){
    Component.call(this, 'ul');
    this.addClass('instructions');
  }

  inherit(Instructions, Component, [
    function addInstruction(op){
      // if (this.children.length > 100) {
      //   this.element.removeChild(this.children[0].element);
      //   this.children = this.children.slice(1);
      // }
      this.append(new Instruction(op[0], op[1]))
      this.element.scrollTop = this.element.scrollHeight;
    }
  ]);

  return Instructions;
})();



var Key = function(){
  function Key(key){
    Component.call(this, 'div');
    this.addClass('key');
    this.text(key);
  }

  inherit(Key, Component);

  return Key;
}();

var attributes = ['___', 'E__', '_C_', 'EC_', '__W', 'E_W', '_CW', 'ECW', '__A', 'E_A', '_CA', 'ECA'];


var Property = (function(){
  function Property(mirror, key){
    Component.call(this, 'li');
    this.mirror = mirror;
    this.attrs = attributes[mirror.propAttributes(key)];
    this.addClass('property');
    this._key = key;
    this.key = new Key(key);
    this.key.addClass(this.attrs);
    this.append(this.key);
    this.prop = mirror.get(key);
    this.property = renderer.render(this.prop);
    this.append(this.property);
    this.append(_('div'));
    this.append(this.property.createTree());
  }

  inherit(Property, Component, [
    function refresh(){
      var attrs = attributes[this.mirror.propAttributes(this._key)];
      if (attrs !== this.attrs) {
        this.key.removeClass(this.attrs);
        this.key.addClass(attrs);
        this.attrs = attrs;
      }
      if (this.prop) {
        var prop = this.mirror.get(this._key);
        if (prop.subject !== this.prop.subject) {
          this.prop = prop;
          this.replace(this.property, renderer.render(prop));
        } else if (this.property.tree) {
          this.property.tree.refresh();
        }
      }
    }
  ]);

  return Property;
})();


function createSpecialProperty(label, classname, callback){
  var SpecialProperty = function(mirror){
    Component.call(this, 'li');
    this.mirror = mirror;
    this.addClass('property');
    this.key = new Key(label);
    this.key.addClass(classname);
    this.append(this.key);
    this.prop = callback(mirror);
    this.property = renderer.render(this.prop);
    this.append(this.property);
    this.append(_('div'));
    this.append(this.property.createTree());
  }

  inherit(SpecialProperty, Property, [
    function refresh(){
      var prop = callback(this.mirror);
      if (this.prop !== prop) {
        this.prop = prop;
        this.element.removeChild(this.element.lastElementChild);
        this.append(renderer.render(this.property));
      }
    }
  ]);

  return SpecialProperty;
}

var Scope = createSpecialProperty('[[scope]]', 'FunctionScope', function(mirror){ return mirror.getScope() });
var Proto = createSpecialProperty('[[proto]]', 'Proto', function(mirror){ return mirror.getPrototype() });
var Env = createSpecialProperty('[[env]]', 'Env', function(mirror){ return mirror.getEnvironment() });
var Outer = createSpecialProperty('[[outer]]', 'Outer', function(mirror){ return mirror.getPrototype() });

var PreviewProperty = (function(){
  function PreviewProperty(mirror, key){
    Component.call(this, 'li');
    this.mirror = mirror;
    this.attrs = attributes[mirror.propAttributes(key)];
    this.addClass('preview-property');
    this.key = new Key(key);
    this.key.addClass(this.attrs);
    this.append(this.key);
    this.prop = mirror.get(key);
    this.property = previewRenderer.render(this.prop);
    this.append(this.property);
  }

  inherit(PreviewProperty, Property);

  return PreviewProperty;
})();


var Index = (function(){
  function Index(mirror, index){
    Component.call(this, 'li');
    this.mirror = mirror;
    this._key = index;
    this.addClass('index');
    this.prop = mirror.get(index);
    this.property = previewRenderer.render(this.prop);
    this.append(this.property);
  }

  inherit(Index, PreviewProperty, [
    function refresh(){
      if (this.prop) {
        var prop = this.mirror.get(this._key);
        if (prop.subject !== this.prop.subject) {
          this.prop = prop;
          this.replace(this.property, renderer.render(prop));
        } else if (this.property.tree) {
          this.property.tree.refresh();
        }
      }
    }
  ]);

  return Index;
})();


var Label = (function(){
  function Label(kind){
    Component.call(this, 'div');
    this.addClass('label');
    this.addClass(kind);
  }

  inherit(Label, Component);

  return Label;
})();


var Tree = (function(){
  function Tree(){
    Component.call(this, 'ul');
    this.addClass('tree');
    this.hide();
    this.expanded = false;
  }

  inherit(Tree, Component, [
    function expand(){
      if (!this.expanded && this.emit('expand')) {
        this.expanded = true;
        this.show();
        return true;
      }
      return false;
    },
    function contract(){
      if (this.expanded && this.emit('contract')) {
        this.expanded = false;
        this.hide();
        return true;
      }
      return false;
    },
    function toggle(){
      if (this.expanded) {
        this.contract();
        return false;
      } else {
        this.expand();
        return true;
      }
    },
    function refresh(){
      var children = this.children || [];
      for (var i=0; i < children.length; i++) {
        children[i].refresh && children[i].refresh();
      }
      return this;
    },
    function forEach(callback, context){
      context = context || this;
      var children = this.children || [];
      for (var i=0; i < children.length; i++) {
        callback.call(context, children[i], i, this);
      }
      return this;
    }
  ]);

  return Tree;
})();


var Result = (function(){
  function Result(result){
    Component.call(this, 'li');
    this.result = this.append(result);
    var tree = result.createTree();
    if (tree) {
      this.append(_('div'));
      this.tree = this.append(tree);
    }
  }

  inherit(Result, Component, [
    function refresh(){
      this.result.refresh();
    },
    function expand(){
      this.result.expand();
    },
    function contract(){
      this.result.contract();
    },
    function toggle(){
      this.result.toggle();
    }
  ]);

  return Result;
})();




function creator(Ctor){
  function create(mirror){
    var item = new Ctor(mirror);
    item.refresh();
    return item;
  };

  Ctor.create = create;
}

var Leaf = (function(){
  function Leaf(mirror){
    Component.call(this, 'div');
    this.mirror = mirror;
    this.addClass('leaf');
    this.label = new Label(mirror.kind);
    this.append(this.label);
  }

  creator(Leaf);
  inherit(Leaf, Component, [
    function refresh(){
      this.label.text(this.mirror.label());
      return this;
    },
    function createTree(){
      return null;
    }
  ]);

  return Leaf;
})();


var StringLeaf = (function(){
  function StringLeaf(mirror){
    Leaf.call(this, mirror);
  }

  creator(StringLeaf);
  inherit(StringLeaf, Leaf, [
    function refresh(){
      this.label.text(utility.quotes(this.mirror.subject));
      return this;
    },
  ]);

  return StringLeaf;
})();


var NumberLeaf = (function(){
  function NumberLeaf(mirror){
    Leaf.call(this, mirror);
  }

  creator(NumberLeaf);
  inherit(NumberLeaf, Leaf, [
    function refresh(){
      var label = this.mirror.label();
      this.label.text(label === 'number' ? this.mirror.subject : label);
      return this;
    },
  ]);

  return NumberLeaf;
})();


var Branch = (function(){
  function Branch(mirror){
    Component.call(this, 'div');
    this.mirror = mirror;
    this.addClass('branch');
    this.label = this.append(this.createLabel());
    this.preview = this.append(this.createPreview());
  }

  creator(Branch);
  inherit(Branch, Component, [
    function createLabel(){
      var label = new Label(this.mirror.kind);
      label.on('click', function(e){
        if (this.tree) {
          this.tree.expanded ? this.contract() : this.expand();
        }
      }, this);
      return label;
    },
    function createTree(){
      return this.tree = new Tree;
    },
    function createPreview(){
      return previewRenderer.render(this.mirror);
    },
    function expand(){
      if (!this.tree.expanded) {
        this.expanded();
        this.addClass('expanded');
        this.tree.expand();
      }
      return this;
    },
    function contract(){
      if (this.tree.expanded) {
        this.contracted();
        this.removeClass('expanded');
        this.tree.contract();
      }
      return this;
    },
    function expanded(){
      this.preview.hide();
      if (!this.tree.initialized) {
        this.initTree();
      } else {
        this.tree.refresh();
      }
      return this;
    },
    function contracted(){
      this.preview.show();
      return this;
    },
    function refresh(){
      this.label.text(this.mirror.label());
      return this;
    },
    function initTree(){
      if (!this.tree.initialized) {
        this.tree.initialized = true;
        this.keys = this.mirror.list(true);
        utility.iterate(this.keys, function(key){
          this.tree.append(new Property(this.mirror, key));
        }, this);
        this.tree.append(new Proto(this.mirror));
      }
      return this;
    }
  ]);

  return Branch;
})();


var FunctionBranch = (function(){
  function FunctionBranch(mirror){
    Branch.call(this, mirror);
  }

  creator(FunctionBranch);
  inherit(FunctionBranch, Branch, [
    function createLabel(){
      var label = Branch.prototype.createLabel.call(this),
          name = this.mirror.getName(),
          params = this.mirror.getParams();

      if (params.rest) {
        params.push('...'+params.pop());
      }

      label.append(new Span(name, 'FunctionName'));
      var container = new Span('', 'Params');
      for (var i=0; i < params.length; i++) {
        container.append(new Span(params[i], 'Param'))
      }
      label.append(container);
      return label;
    },
    function createPreview(){
      return new Preview(this.mirror);
    },
    function refresh(){
      this.preview && this.preview.refresh();
      this.tree && this.tree.refresh();
      return this;
    },
    function initTree(){
      Branch.prototype.initTree.call(this);
      this.tree.append(new Scope(this.mirror));
    }
  ]);

  return FunctionBranch;
})();



var GlobalBranch = (function(){
  function GlobalBranch(mirror){
    Branch.call(this, mirror);
  }

  creator(GlobalBranch);
  inherit(GlobalBranch, Branch, [
    function initTree(){
      Branch.prototype.initTree.call(this);
      if (this.mirror.subject.env.outer) {
        this.tree.append(new Env(this.mirror));
      }
    }
  ]);

  return GlobalBranch;
})();


var ScopeBranch = (function(){
  function ScopeBranch(mirror){
    Branch.call(this, mirror);
  }

  creator(ScopeBranch);
  inherit(ScopeBranch, Branch, [
    function initTree(){
      if (!this.tree.initialized) {
        this.tree.initialized = true;
        this.keys = this.mirror.list(true);
        utility.iterate(this.keys, function(key){
          this.tree.append(new Property(this.mirror, key));
        }, this);
        if (this.mirror.subject.outer) {
          this.tree.append(new Outer(this.mirror));
        }
      }
      return this;
    }
  ]);

  return ScopeBranch;
})();



var ThrownBranch = (function(){
  function ThrownBranch(mirror){
    Branch.call(this, mirror);
  }

  creator(ThrownBranch);
  inherit(ThrownBranch, Branch, [
    function createLabel(){
      var location = new Div('.Location');
      location.append(new Span('Uncaught Exception ', 'Uncaught'));
      location.append(new Span(' in '));
      location.append(new Span(this.mirror.origin(), 'Origin'));
      location.append(new Span(' at '));
      location.append(new Span(this.mirror.getValue('line'), 'Line'));
      var label = new Div();
      label.append(location);
      label.append(new Div(this.mirror.getError(), 'Exception'));
      return label;
    },
    function createPreview(){

      var code = new Component('pre');
      code.addClass('Code');
      code.text(this.mirror.getValue('code'));

      var label = new Div('.error');
      label.append(code);
      label.refresh = function(){};
      return label;
    },
    function refresh(){
      this.preview && this.preview.refresh();
      this.tree && this.tree.refresh();
    }
  ]);

  return ThrownBranch;
})();


var Preview = (function(){
  function Preview(mirror){
    Component.call(this, 'ul');
    this.mirror = mirror;
    this.addClass('preview');
    this.createPreview();
  }

  creator(Preview);
  inherit(Preview, Branch, [
    function createPreview(){
      utility.iterate(this.mirror.list(false), function(key){
        this.append(new PreviewProperty(this.mirror, key));
      }, this);
    },
    function refresh(){
      var children = this.children || [];
      return this;
    },
  ]);

  return Preview;
})();


var IndexedPreview = (function(){
  function IndexedPreview(mirror){
    Preview.call(this, mirror);
    this.addClass('ArrayPreview');
  }

  creator(IndexedPreview);
  inherit(IndexedPreview, Preview, [
    function createPreview(){
      var len = this.mirror.getValue('length');
      for (var i=0; i < len; i++) {
        this.append(new Index(this.mirror, i));
      }
    }
  ]);

  return IndexedPreview;
})();



var FunctionPreview = (function(){
  function FunctionPreview(mirror){
    Preview.call(this, mirror);
    this.addClass('FunctionPreview');
  }

  creator(FunctionPreview);
  inherit(FunctionPreview, Preview, [
    function createPreview(){
      this.text(this.mirror.getName());
    }
  ]);

  return FunctionPreview;
})();


var renderer = new debug.Renderer({
  Unknown: Branch.create,
  BooleanValue: Leaf.create,
  StringValue: StringLeaf.create,
  NumberValue: NumberLeaf.create,
  UndefinedValue: Leaf.create,
  NullValue: Leaf.create,
  Accessor: Leaf.create,
  Global: GlobalBranch.create,
  Thrown: ThrownBranch.create,
  Arguments: Branch.create,
  Array: Branch.create,
  Boolean: Branch.create,
  Date: Branch.create,
  Error: Branch.create,
  Function: FunctionBranch.create,
  JSON: Branch.create,
  Map: Branch.create,
  Math: Branch.create,
  Module: Branch.create,
  Object: Branch.create,
  Number: Branch.create,
  RegExp: Branch.create,
  Scope: ScopeBranch.create,
  Set: Branch.create,
  String: Branch.create,
  WeakMap: Branch.create
});

var previewRenderer = new debug.Renderer({
  Unknown: Preview.create,
  BooleanValue: Leaf.create,
  StringValue: StringLeaf.create,
  NumberValue: NumberLeaf.create,
  UndefinedValue: Leaf.create,
  NullValue: Leaf.create,
  Accessor: Leaf.create,
  Global: Preview.create,
  Thrown: Preview.create,
  Arguments: Preview.create,
  Array: IndexedPreview.create,
  Boolean: Preview.create,
  Date: Preview.create,
  Error: Preview.create,
  Function: FunctionPreview.create,
  JSON: Preview.create,
  Map: Preview.create,
  Math: Preview.create,
  Module: Preview.create,
  Object: Preview.create,
  Number: Preview.create,
  RegExp: Preview.create,
  Scope: Preview.create,
  Set: Preview.create,
  String: Preview.create,
  WeakMap: Preview.create
});





var win = new Component(window),
    body = new Component(document.body);


void function(){
  var stdout = new Console,
      inspector = new Tree,
      input = new Editor,
      instructions = new Instructions;

  inspector.removeClass('tree');
  inspector.addClass('inspector');
  inspector.show();

  var main = new Panel(null, {
    name: 'container',
    top: {
      left: {
        size: 250,
        top: {
          size: .7,
          label: 'Instructions',
          name: 'instructions',
          content: instructions,
          scroll: true
        },
        bottom: {
          label: 'stdout',
          name: 'output',
          content: stdout,
          scroll: true
        },
      },
      right: {
        label: 'Inspector',
        name: 'view',
        content: inspector,
        scroll: true
      },
    },
    bottom: {
      name: 'input',
      size: .3,
      content: input
    }
  });


  void function(){
    var scroll = new Component(document.querySelector('.CodeMirror-scroll')),
        scrollbar = input.append(new VerticalScrollbar(scroll)),
        child = input.child();

    scroll.removeClass('scrolled');
    child.removeClass('scroll-container');
    child.style('right', null);
    scrollbar.right(0);
    scrollbar.width(scrollbar.width() + 2);
    main.splitter.right(0);
  }();


  function createRealm(){
    function run(code){
      realm.evaluateAsync(code, inspect);
    }

    function inspect(o){
      var tree = inspector.append(new Result(renderer.render(o)));
      inspector.element.scrollTop = inspector.element.scrollHeight;
      inspector.refresh();
      return tree;
    }

    var ops = new utility.Feeder(function(op){
      instructions.addInstruction(op);
    });

    realm = new Realm;

    realm.on('throw', function(err){
      console.log(err);
      inspector.append(new Result(renderer.render(err)));
      inspector.element.scrollTop = inspector.element.scrollHeight;
      inspector.refresh();
    });


    realm.on('write', function(args){
      stdout.write.apply(stdout, args);
    });

    realm.on('clear', function(){
      stdout.clear();
    });

    realm.on('backspace', function(n){
      stdout.backspace(n);
    });

    realm.on('pause', function(){
      var overlay = body.append(new Div('.overlay')),
          unpause = body.append(new Button('Unpause', 'unpause'));

      body.addClass('paused');
      input.disable();
      unpause.once('click', function(){
        body.removeClass('paused');
        input.enable();
        unpause.remove();
        overlay.remove();
        realm.resume();
      });
    });

    input.on('entry', function(evt){
      run(evt.value);
    });

    setTimeout(function(){
      realm.on('op', function(op){
        ops.push(op);
      });
    }, 100);

    realm.evaluateAsync('this', function(result){
      var item = inspect(result);
      setTimeout(function(){ item.expand() }, 50);
    });
  }
  setTimeout(createRealm, 1);
}();


})(this, continuum.Realm, continuum.constants, continuum.utility, continuum.debug);
delete continuum

