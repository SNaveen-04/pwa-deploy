import { Component } from '@angular/core';
import { Router,RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { FormGroup,FormControl,Validators,ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterModule,ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  authService = inject(AuthService);
  router = inject(Router)

  protected signupForm = new FormGroup({
    name: new FormControl('',[Validators.required]),
    email: new FormControl('',[Validators.required,Validators.email]),
    password: new FormControl('',[Validators.required])
  })

  onSubmit(){
    if(this.signupForm.valid){
      console.log(this.signupForm.valid);
      this.authService.signup(this.signupForm.value)
      .subscribe({
        next: (data:any) => {
          console.log(data);
          this.router.navigate(['login']);
        },
        error: (err) => {
          const msg = err.error.message;
          alert(msg)
          this.signupForm.reset();
          // console.log('error')
        }
      })
    }
    else{
      alert("Invalid Form")
    }
  }
}
