// push-notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  readonly VAPID_PUBLIC_KEY = ''; 

  constructor(private swPush: SwPush, private http: HttpClient) {}

  requestPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission();
  }

  // Subscribe to notifications and send the subscription to the server
  subscribeToNotifications(): Promise<PushSubscription | null> {
    return this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY,
    }).then(subscription => {
      this.saveSubscriptionToServer(subscription);
      console.log('Subscription:', subscription);
      return subscription; 
    }).catch(err => {
      console.error('Could not subscribe to notifications', err);
      return null; 
    });
  }

  // Save the subscription object to the server
  private saveSubscriptionToServer(subscription: PushSubscription) {
    this.http.post('/api/notifications/subscribe', subscription).subscribe(
      response => {
        console.log('Subscription saved to server:', response);
      },
      error => {
        console.error('Error saving subscription:', error);
      }
    );
  }

  // Send a notification (triggers a request to the server to send notifications)
  sendNotification() {
    this.http.post('/api/notifications/send', {}).subscribe(
      response => {
        console.log('Notification send request sent:', response);
      },
      error => {
        console.error('Error sending notification:', error);
      }
    );
  }
}
