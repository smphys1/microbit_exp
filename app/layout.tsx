import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'탐구노트 ver2 | 제출과 평가',description:'마이크로비트 자유주제탐구: 주제 10점, 파일 10점, 보고서 30점'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
