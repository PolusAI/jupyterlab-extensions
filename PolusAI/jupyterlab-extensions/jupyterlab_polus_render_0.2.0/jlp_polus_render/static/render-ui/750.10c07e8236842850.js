"use strict";(self.webpackChunkrender_ui=self.webpackChunkrender_ui||[]).push([[750],{1750:(i,r,s)=>{s.r(r),s.d(r,{default:()=>o});var l=s(605);class o extends l.Z{decodeBlock(u){const d=new DataView(u),a=[];for(let e=0;e<u.byteLength;++e){let t=d.getInt8(e);if(t<0){const n=d.getUint8(e+1);t=-t;for(let c=0;c<=t;++c)a.push(n);e+=1}else{for(let n=0;n<=t;++n)a.push(d.getUint8(e+n+1));e+=t+1}}return new Uint8Array(a).buffer}}}}]);