(this.webpackJsonpgame_master=this.webpackJsonpgame_master||[]).push([[0],{115:function(e,t){},116:function(e,t){},118:function(e,t){},120:function(e,t){},137:function(e,t,c){"use strict";c.r(t);var n=c(0),r=c.n(n),o=c(63),s=c.n(o),a=(c(72),c(22)),i=c(9),l=c(10),u=c.n(l),b=c(16),j=c(13),d=(c(74),c(2)),f=function(e){var t=this,c=Object(n.useState)(e),r=Object(j.a)(c,2),o=r[0],s=r[1],a=Object(n.useRef)(e);this.state=o,Object(n.useEffect)((function(){o===a.current&&(t.state=o)}),[o]),this.get=function(){return a.current},this.set=function(e){a.current=e,s(e),t.state=a.current}},O=c(64),p=c.n(O),h=c(65),m=c(66),x=c.n(m),v=c(139),w=function e(t){var c=this,n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],r=arguments.length>2&&void 0!==arguments[2]&&arguments[2];Object(h.a)(this,e),this.connect=function(){var e=Object(b.a)(u.a.mark((function e(t){return u.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",new Promise((function(e){c.client=x.a.connect(t),c.client.on("message",c.receive),c.client.on("disconnect",(function(){console.log("oops disconnected")})),c.client.on("connect",(function(){console.log("connected"),e(c)}))})));case 1:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),this.subscribe=function(e,t){c.client.subscribe("".concat(c.base).concat(e)),c.subscriptions[e]={function:t}},this.receive=function(e,t){for(var n in c.subscriptions)e==="".concat(c.base).concat(n)&&c.subscriptions[n].function(t)},this.send=function(e,t){c.client.publish("".concat(c.base).concat(e),t)};var o=Object(v.a)();console.log(o),this.subscriptions={},this.base="";var s=n?r?"wss":"ws":"mqtt";return this.connect("".concat(s,"://").concat(t))},g=c(1);function _(e){var t=e.mqtt,c=e.script_id,r=e.rooms,o=e.room,s=e.room_url,l=Object(n.useCallback)(Object(b.a)(u.a.mark((function e(){var t;return u.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("".concat(window._url.fetch,"/api/room/delete/").concat(s));case 2:if(e.sent){e.next=5;break}return e.abrupt("return");case 5:delete(t=Object(i.a)({},r.get()))[s],r.set(t);case 8:case"end":return e.stop()}}),e)}))),[r.state]),d=Object(n.useCallback)(Object(b.a)(u.a.mark((function e(){return u.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("".concat(window._url.fetch,"/api/room/restart/").concat(s));case 2:if(e.sent){e.next=5;break}return e.abrupt("return");case 5:case"end":return e.stop()}}),e)}))),[r.state]),f=Object(n.useCallback)((function(){window.open("".concat(window._url.editor,"/test/").concat(s))}),[]),O=Object(n.useCallback)((function(e){var c=e.room_url,n=e.roles,o=function(e){var t=e.room_url,c=e.role_url,n=e.state,o=r.get();if(o[t]){var s=o[t].roles,l=Object(i.a)(Object(i.a)({},o),{},Object(a.a)({},t,Object(i.a)(Object(i.a)({},o[t]),{},{roles:Object(i.a)(Object(i.a)({},s),{},Object(a.a)({},c,Object(i.a)(Object(i.a)({},o[t].roles[c]),n)))})));r.set(l)}else console.error(o,t,c,n)};n&&(Object.entries(n).forEach((function(e){var n=Object(j.a)(e,2),r=n[0];n[1]&&(t.subscribe("/monitor/".concat(c,"/").concat(r,"/card"),(function(e,t){var n=JSON.parse(e);o({room_url:c,role_url:r,state:{card:n}})})),t.subscribe("/monitor/".concat(c,"/").concat(r,"/status"),(function(e,t){try{var n=JSON.parse(e);console.log(r,n),o({room_url:c,role_url:r,state:n})}catch(s){console.error(s,e)}})),t.subscribe("/monitor/".concat(c,"/").concat(r,"/ping"),(function(e,t){try{var n=JSON.parse(e);console.log("receive ping"),o({room_url:c,role_url:r,state:n})}catch(s){console.error(s,e)}})))})),t.subscribe("/".concat(c,"/#"),(function(e,t){e=JSON.parse(e)})))}),[r.state]);return Object(n.useEffect)((function(){O({room_url:s,roles:o.roles})}),[]),Object(g.jsxs)("div",{className:"room",children:[Object(g.jsxs)("div",{className:"top",children:[Object(g.jsxs)("h1",{children:["room ",c," ",s," "]})," ",Object(g.jsx)("button",{onClick:l,children:"delete"}),Object(g.jsx)("button",{onClick:d,children:"restart"}),Object(g.jsx)("button",{onClick:f,children:"combo"})]}),Object(g.jsx)("div",{className:"roles",children:o&&o.roles?Object.entries(o.roles).sort((function(e,t){return e[1].role_id-t[1].role_id})).map((function(e){var t=Object(j.a)(e,2),c=t[0],n=t[1];return Object(g.jsx)(k,{room_url:s,role_url:c,role:n},c)})):null})]})}function k(e){var t=e.room_url,c=e.role,r=e.role_url,o=Object(n.useRef)(),s=Object(n.useCallback)((function(){window.open(o.current)}),[]),a=Object(n.useCallback)((function(e){p()(o.current),e.target.innerHTML="copied!",setTimeout((function(){e.target.innerHTML="copy"}),1e3)}),[]);return Object(n.useEffect)((function(){console.log("room_url is ",t),o.current="".concat(window._url.play,"/").concat(t).concat(r)}),[]),Object(g.jsx)("div",{className:"role",style:{border:"1px solid ".concat("connected"===c.status?"green":"finished"===c.status?"blue":"red")},children:c?Object(g.jsxs)(g.Fragment,{children:[Object(g.jsxs)("div",{className:"marginBottom",children:[Object(g.jsxs)("div",{className:"row",children:[Object(g.jsx)("label",{children:"role"}),Object(g.jsx)("span",{children:c.role_id})]}),Object(g.jsxs)("div",{className:"row",children:[Object(g.jsx)("label",{children:"status"})," ",Object(g.jsx)("span",{style:{color:"connected"===c.status?"green":"finished"===c.status?"blue":"red"},children:c.status?c.status:"never connected"})]}),"connected"===c.status?Object(g.jsxs)("div",{className:"row",children:[Object(g.jsx)("label",{children:"ping"}),Object(g.jsx)("span",{style:{color:"error"===c.ping?"red":"black"},children:c.ping?"".concat(c.ping,"ms"):null})]}):null]}),Object(g.jsxs)("div",{className:"marginBottom instruction",children:[Object(g.jsx)("div",{className:"row",children:Object(g.jsx)("label",{children:"card"})}),Object(g.jsxs)("div",{className:"row",children:[Object(g.jsx)("label",{className:"margin",children:"type"})," ",c.card?Object(g.jsx)("span",{className:"italic",children:c.card.type}):null]}),Object(g.jsxs)("div",{className:"row",children:[Object(g.jsx)("label",{className:"margin",children:"text"})," ",c.card&&"video"!==c.card.type?Object(g.jsx)("span",{children:c.card.text}):null]})]}),Object(g.jsxs)("div",{className:"flex",children:[Object(g.jsx)("button",{onClick:s,children:"open "}),Object(g.jsx)("button",{onClick:a,children:"copy"})]})]}):null})}var N=function(){var e=Object(d.f)().script_id,t=new f({}),c=new f(!1),r=new n.useState(!1),o=Object(j.a)(r,2),s=o[0],l=o[1];Object(n.useEffect)(Object(b.a)(u.a.mark((function e(){var t;return u.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new w(window._url.mqtt,!0,-1!=window.location.protocol.indexOf("https"));case 2:t=e.sent,console.log("connect???",t),l(t);case 5:case"end":return e.stop()}}),e)}))),[]),Object(n.useEffect)(Object(b.a)(u.a.mark((function n(){var r;return u.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:if(s){n.next=2;break}return n.abrupt("return");case 2:if(c.state){n.next=15;break}return c.set(!0),n.next=6,fetch("".concat(window._url.fetch,"/api/room/getRooms/").concat(e));case 6:return r=n.sent,n.next=9,r.json();case 9:if(r=n.sent){n.next=12;break}return n.abrupt("return");case 12:Object.entries(r).forEach((function(e){var t=Object(j.a)(e,2);t[0],t[1]})),s.subscribe("/createRoom/".concat(e),(function(e,t){var c=JSON.parse(e),n=c.room_url,r=c.roles,o=c.script_id;console.log("/createRoom/".concat(o),n,r,o),O({room_url:n,roles:r,script_id:o})})),t.set(r);case 15:case"end":return n.stop()}}),n)}))),[e,t,s]);var O=Object(n.useCallback)((function(e){var c=e.room_url,n=e.roles,r=e.script_id,o=Object(i.a)({},t.get());console.log(o),t.set(Object(i.a)(Object(i.a)({},o),{},Object(a.a)({},c,{roles:n,script_id:r})))}),[t.state]);return Object(g.jsx)("div",{className:"App",children:s?Object.entries(t.state).map((function(c){var n=Object(j.a)(c,2),r=n[0],o=n[1];return Object(g.jsx)(_,{mqtt:s,script_id:e,rooms:t,room:o,room_url:r},r)})):null})},y=c(35),C=-1!=window.location.href.indexOf("localhost");window._url={mqtt:C?"localhost:8883":"socket.datingproject.net/mqtt",editor:C?"http://localhost:3000":"https://script.datingproject.net",fetch:C?"http://localhost:8080":"https://fetch.datingproject.net",play:C?"http://localhost:3001":"https://play.datingproject.net",monitor:C?"http://localhost:3004":"https://monitor.datingproject.net"},s.a.render(Object(g.jsx)(r.a.StrictMode,{children:Object(g.jsx)(y.a,{children:Object(g.jsx)(d.c,{children:Object(g.jsxs)(d.a,{path:"/:script_id",children:[Object(g.jsx)(N,{}),Object(g.jsx)("div",{className:"background",children:Object(g.jsx)("div",{})})]})})})}),document.getElementById("root"))},72:function(e,t,c){},74:function(e,t,c){},79:function(e,t){},81:function(e,t){}},[[137,1,2]]]);
//# sourceMappingURL=main.d2c37a4d.chunk.js.map