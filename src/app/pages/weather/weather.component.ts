import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css'],
})
export class WeatherComponent {
  weatherForm: FormGroup;
  weatherData: any;

  constructor(private fb: FormBuilder, private httpClient: HttpClient) {
    this.weatherForm = this.fb.group({
      city: ['', Validators.required], // Initialize with validators
    });
  }

  onSubmit() {
    if (this.weatherForm.valid) {
      const city = this.weatherForm.value.city;
      console.log(`Fetching weather for: ${city}`);
      this.getCurrentWeather(city).subscribe(
        (data: any) => {
          console.log(data);
          this.weatherData = data; // Store data to display in the template
        },
        (error) => {
          console.error('Error fetching weather:', error);
        }
      );
    }
  }

  getCurrentWeather(city: string) {
    const apiKey = '493fe341243d4724a5f155106242509';
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;
    return this.httpClient.get(apiUrl);
  }
}
