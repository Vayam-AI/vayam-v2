import fs from 'fs';
import path from 'path';
import { sendEmail } from './email';

interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

export class EmailTemplateProcessor {
  private static templateCache: Map<string, string> = new Map();
  
  /**
   * Get template content from file system
   */
  private static async getTemplate(templateName: string): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }
    
    try {
      const templatePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      
      // Cache the template
      this.templateCache.set(templateName, templateContent);
      
      return templateContent;
    } catch (error) {
      // Template reading error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error reading template ${templateName}:`, error);
      }
      throw new Error(`Template ${templateName} not found`);
    }
  }
  
  /**
   * Simple template engine - replaces {{variable}} with actual values
   */
  private static processTemplate(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Process conditional blocks {{#if variable}}...{{/if}}
   */
  private static processConditionals(template: string, data: TemplateData): string {
    return template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = data[key];
      return value ? content : '';
    });
  }
  
  /**
   * Render email template with data
   */
  static async renderTemplate(templateName: string, data: TemplateData): Promise<string> {
    try {
      let template = await this.getTemplate(templateName);
      
      // Process conditionals first
      template = this.processConditionals(template, data);
      
      // Then process variables
      template = this.processTemplate(template, data);
      
      return template;
    } catch (error) {
      // Template rendering error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rendering template:', error);
      }
      throw error;
    }
  }
  
  /**
   * Clear template cache (useful for development)
   */
  static clearCache(): void {
    this.templateCache.clear();
  }
}

// Template data interfaces for type safety
export interface SMEInvitationData extends TemplateData {
  name: string;
  questionTitle: string;
  questionId: string | number;
  questionDescription?: string;
  questionUrl: string;
  platformUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WelcomeData extends TemplateData {
  name: string;
  platformUrl: string;
  [key: string]: string | number | boolean | undefined;
}

export interface NewSolutionNotificationData extends TemplateData {
  questionTitle: string;
  questionUrl: string;
  solutionAuthor: string;
  solutionPreview: string;
  unsubscribeUrl?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OTPVerificationData extends TemplateData {
  otp: string;
  [key: string]: string | number | boolean | undefined;
}

// Convenience functions for common email types
export class EmailNotifications {
  static async sendSMEInvitation(email: string, data: SMEInvitationData): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await EmailTemplateProcessor.renderTemplate('sme-invitation', data);
      const result = await sendEmail(
        email,
        `Invitation to contribute as SME: ${data.questionTitle}`,
        content,
        true
      );
      return result;
    } catch (error) {
      // SME invitation error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending SME invitation:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  static async sendWelcomeEmail(email: string, data: WelcomeData): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await EmailTemplateProcessor.renderTemplate('welcome', data);
      const result = await sendEmail(
        email,
        'Welcome to Vayam!',
        content,
        true
      );
      return result;
    } catch (error) {
      // Welcome email error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending welcome email:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  static async sendNewSolutionNotification(email: string, data: NewSolutionNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await EmailTemplateProcessor.renderTemplate('new-solution-notification', data);
      const result = await sendEmail(
        email,
        `New solution added to: ${data.questionTitle}`,
        content,
        true
      );
      return result;
    } catch (error) {
      // Solution notification error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending solution notification:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async sendOTPVerification(email: string, data: OTPVerificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await EmailTemplateProcessor.renderTemplate('otp-verification', data);
      const result = await sendEmail(
        email,
        'Your Verification Code',
        content,
        true
      );
      return result;
    } catch (error) {
      // OTP email error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending OTP email:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}