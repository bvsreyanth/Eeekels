import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { AuthField, LogsType } from '../services/api.service';
import { LogSourcesFacade } from '../services/api.sourcesfacade.service';
import { LogSourceProviderEnum } from '../../enums/logsource-providerenums';

@Component({
    selector: 'app-add-logsources',
    imports: [CommonModule,FormsModule,ReactiveFormsModule],
    templateUrl: './add-logsources.html',
    styleUrl: './add-logsources.scss'
})
export class AddLogsources implements OnInit {
    showModal = false;
    connectionType: 'api' | 'file' = 'api';
    selectedProvider = '';
    selectedFile: File | null = null;

    private readonly logSourcesFacade = inject(LogSourcesFacade);
    private readonly fb = inject(FormBuilder);

  @Output() logSourceAdded = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  apiForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  fileUpload = {
      sourceName: '',
      format: ''
  };

  ngOnInit() {
      this.apiForm = this.fb.group({
          displayName: ['', [Validators.required, Validators.pattern(/\S+/)]],
          apiKey: ['', [Validators.required, Validators.pattern(/\S+/)]],
          username: [''],
          password: [''],
          baseUrl: ['', [Validators.required, Validators.pattern(/\S+/)]]
      });
  }

  get f() { return this.apiForm.controls; }

  openModal() {
      this.resetForm();
      this.showModal = true;
      this.connectionType = 'api';
      this.selectedProvider = '';
  }

  closeModal() {
      this.showModal = false;
      this.selectedProvider = '';
      this.connectionType = 'api';
      this.resetForm();
      this.errorMessage = null;
      this.successMessage = null;
      this.selectedFile = null;
      this.modalClosed.emit();
  }

  selectConnection(type: 'api' | 'file') {
      this.connectionType = type;
      this.selectedProvider = '';
      this.resetForm();
  }

  selectProvider(provider: string) {
      this.selectedProvider = provider;

      this.apiForm.reset();

      if (provider === 'Fortinet') {
          this.apiForm.get('username')?.setValidators([Validators.required]);
          this.apiForm.get('password')?.setValidators([Validators.required]);
      } else {
          this.apiForm.get('username')?.clearValidators();
          this.apiForm.get('password')?.clearValidators();
      }

      this.apiForm.get('username')?.updateValueAndValidity();
      this.apiForm.get('password')?.updateValueAndValidity();
  }

  onFileSelected(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
          this.selectedFile = input.files[0];
      }
  }

  resetForm() {
      this.apiForm.reset();
      this.fileUpload = { sourceName: '', format: '' };
      this.selectedFile = null;
  }

  addSource() {
      if (this.connectionType === 'api' && this.apiForm.invalid) {
          this.apiForm.markAllAsTouched();
          return;
      }

      console.log('Adding source with type:', this.connectionType);
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      if (this.connectionType === 'api') {
          this.handleAddApiSource();
      } else if (this.connectionType === 'file') {
          this.handleFileSourceSubmission();
      }
  }

  handleFileSourceSubmission() {
      throw new Error('Method not implemented.');
  }

  private handleAddApiSource() {
      const formValue = this.apiForm.value;
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (!formValue.displayName || !formValue.baseUrl) {
          this.errorMessage = 'Please fill in all required fields for the API connection.';
          this.isLoading = false;
          return;
      }

      let providerEnum: LogSourceProviderEnum | undefined;
      let authFields: AuthField[] = [];

      switch (this.selectedProvider) {
      case 'SentinelOne':
          providerEnum = LogSourceProviderEnum.SentinelOne;
          authFields = [
              new AuthField({ key: 'ApiToken', value: formValue.apiKey }),
              new AuthField({ key: 'BaseUrl', value: formValue.baseUrl })
          ];
          break;
      case 'Fortinet':
          providerEnum = LogSourceProviderEnum.Fortinet;
          authFields = [
              new AuthField({ key: 'Username', value: formValue.username }),
              new AuthField({ key: 'Password', value: formValue.password }),
              new AuthField({ key: 'BaseUrl', value: formValue.baseUrl })
          ];
          break;
      case 'Sentinel':
          providerEnum = LogSourceProviderEnum.MicrosoftDefender;
          authFields = [
              new AuthField({ key: 'apiKey', value: formValue.apiKey })
          ];
          break;
      case 'Splunk':
          providerEnum = LogSourceProviderEnum.Splunk;
          authFields = [
              new AuthField({ key: 'apiKey', value: formValue.apiKey })
          ];
          break;
      default:
          this.errorMessage = 'Please select a valid provider.';
          this.isLoading = false;
          return;
      }
      this.logSourcesFacade.addLogSource(
          formValue.displayName,
          providerEnum,
          LogsType._1,
          formValue.baseUrl,
          userTimeZone,
          authFields
      ).pipe(
          catchError(error => {
              console.error('Error adding log source:', error);
              this.errorMessage = `Failed to add log source: ${error.message || 'Unknown error'}`;
              this.isLoading = false;
              return throwError(() => new Error());
          })
      ).subscribe(response => {
          this.isLoading = false;
          if (response && response.publicId) {
              this.successMessage = `Log source added successfully with Public ID: ${response.publicId}`;
              this.logSourceAdded.emit();
              this.closeModal();
          } else {
              this.errorMessage = 'Failed to add log source: No public ID returned.';
          }
      });
  }
}
