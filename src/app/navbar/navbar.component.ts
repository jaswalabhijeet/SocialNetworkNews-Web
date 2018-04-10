import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ToastrService} from 'ngx-toastr';
import {ApiService} from '../api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  authenticated: boolean;

  constructor(public apiService: ApiService, private toastr: ToastrService) { }

  ngOnInit() {
    if (!this.apiService.inCallback) {
      this.authCheck();
    }
  }

  authCheck() {
    this.apiService.checkIfUserIsAuthenticated()
    // TODO: Better variable naming
      .retryWhen(oerror => {
        return oerror
          .mergeMap((error: any) => {
            if (String(error.status).startsWith('50')) {
              return Observable.of(error.status).delay(1000);
            } else if (error.status === 404) {
              return Observable.throw({error: 'Sorry, there was an error. The Server just doesn\'t find any data for the requested time :('});
            } else if (error.status === 401) {
              return Observable.throw({error: '401'});
            }
            return Observable.throw({error: 'Unknown error'});
          })
          .take(5)
          // TODO: Allow to link to a Status Page
          .concat(Observable.throw({error: 'Sorry, there was an error (after 5 retries). This probably means we can\'t reach our API Server :('}));
      })
      .subscribe(
        data => {
          this.authenticated = true;
          if (!this.apiService.userUUID) {
            this.apiService.userUUID = data.headers.get('UUID');
          }
        },
        err => {
          if (err['error'] === '401') {
            this.authenticated = false;
          } else {
            this.toastr.error(err['error'], 'Error connecting API', {
              positionClass: 'toast-top-center',
              disableTimeOut: true
            });
            throw err;
          }
        },
        () => console.log('done checking if authenticated')
      );
  }

}