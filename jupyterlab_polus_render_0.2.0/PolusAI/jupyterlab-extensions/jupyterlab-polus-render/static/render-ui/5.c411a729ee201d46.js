"use strict";(self.webpackChunkrender_ui=self.webpackChunkrender_ui||[]).push([[5],{7005:(B,D,y)=>{y.r(D),y.d(D,{default:()=>v});var A=y(605);function C(c,o){for(let r=o.length-1;r>=0;r--)c.push(o[r]);return c}class v extends A.Z{decodeBlock(o){return function p(c){const o=new Uint16Array(4093),r=new Uint8Array(4093);for(let e=0;e<=257;e++)o[e]=4096,r[e]=e;let i=258,n=9,h=0;function E(){i=258,n=9}function d(e){const a=function O(c,o,r){const i=o%8,n=Math.floor(o/8),h=8-i,E=o+r-8*(n+1);let d=8*(n+2)-(o+r);const g=8*(n+2)-o;if(d=Math.max(0,d),n>=c.length)return console.warn("ran off the end of the buffer before finding EOI_CODE (end on input code)"),257;let u=c[n]&2**(8-i)-1;u<<=r-h;let s=u;if(n+1<c.length){let l=c[n+1]>>>d;l<<=Math.max(0,r-g),s+=l}return E>8&&n+2<c.length&&(s+=c[n+2]>>>8*(n+3)-(o+r)),s}(e,h,n);return h+=n,a}function g(e,a){return r[i]=a,o[i]=e,i++,i-1}function u(e){const a=[];for(let w=e;4096!==w;w=o[w])a.push(r[w]);return a}const s=[];E();const l=new Uint8Array(c);let f,t=d(l);for(;257!==t;){if(256===t){for(E(),t=d(l);256===t;)t=d(l);if(257===t)break;if(t>256)throw new Error(`corrupted code at scanline ${t}`);C(s,u(t)),f=t}else if(t<i){const e=u(t);C(s,e),g(f,e[e.length-1]),f=t}else{const e=u(f);if(!e)throw new Error(`Bogus entry. Not in dictionary, ${f} / ${i}, position: ${h}`);C(s,e),s.push(e[e.length-1]),g(f,e[e.length-1]),f=t}i+1>=2**n&&(12===n?f=void 0:n++),t=d(l)}return new Uint8Array(s)}(o).buffer}}}}]);