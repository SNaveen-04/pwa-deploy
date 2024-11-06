import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  httpClient = inject(HttpClient);
  baseUrl = 'http://localhost:5000/api'
  constructor() { }

  signup(data:any){
    return this.httpClient.post(this.baseUrl+'/register',data);
  }

  login(data:any){
    return this.httpClient.post(this.baseUrl+'/login',data).pipe(
      tap(result => {
        localStorage.setItem('authUser',JSON.stringify(result))
      })
    )
  }

  logout(){
    localStorage.removeItem('authUser');
  }

  isLoggedIn(){
    return localStorage.getItem('authUser') !== null;
  }
}