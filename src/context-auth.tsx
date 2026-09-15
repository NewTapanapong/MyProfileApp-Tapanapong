import React,{createContext,useContext,useMemo,useState} from 'react';

export type Role='admin'|'user';
export type AuthUser={id:number;username:string;role:Role};

type C={
  token:string|null;
  user:AuthUser|null;
  testMode:boolean;
  login:(u:string,p:string)=>Promise<void>;
  testLogin:(role:Role)=>void;
  logout:()=>void;
};

const API='http://119.59.102.161:3081/api';
const Context=createContext<C|null>(null);

export function AuthProvider({children}:{children:React.ReactNode}){
  const[token,setToken]=useState<string|null>(null);
  const[user,setUser]=useState<AuthUser|null>(null);
  const[testMode,setTestMode]=useState(false);

  const login=async(u:string,p:string)=>{
    const r=await fetch(API+'/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u,password:p})
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d.message||'Login failed');
    setTestMode(false);
    setToken(d.token);
    setUser(d.user);
  };

  // Local UI test mode: does not call the server/database.
  // This lets you verify admin/user visibility before the real DB login is configured.
  const testLogin=(role:Role)=>{
    setTestMode(true);
    setToken(`TEST_${role.toUpperCase()}`);
    setUser({
      id:role==='admin'?1:2,
      username:role==='admin'?'admin':'user',
      role,
    });
  };

  const logout=()=>{
    setToken(null);
    setUser(null);
    setTestMode(false);
  };

  return <Context.Provider value={useMemo(()=>({token,user,testMode,login,testLogin,logout}),[token,user,testMode])}>{children}</Context.Provider>
}

export const useAuth=()=>{
  const c=useContext(Context);
  if(!c)throw new Error('useAuth outside AuthProvider');
  return c;
};
