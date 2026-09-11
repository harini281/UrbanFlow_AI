import {ReactNode} from 'react';
export default function Section({title,subtitle,children}:{title:string;subtitle?:string;children:ReactNode}){return <section className="section"><div className="section-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div></div>{children}</section>}
