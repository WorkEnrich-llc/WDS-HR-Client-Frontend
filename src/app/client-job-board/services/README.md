# Client Job Board Service

This service handles API calls for the client job board, including job listings.

## Subdomain Handling

The service automatically retrieves the subdomain from `localStorage.getItem('company_info')` which is set after login.

### For Localhost Development

Since subdomains don't work on localhost, you have three options:

1. **URL Query Parameter** (Recommended for testing):

   ```
   http://localhost:4200/careers?subdomain=your-subdomain
   ```

2. **Manual localStorage** (For persistent testing):

   ```javascript
   // In browser console:
   localStorage.setItem("test_subdomain", "your-subdomain");
   ```

3. **Set company_info** (Most realistic):
   ```javascript
   // In browser console (after login simulation):
   localStorage.setItem(
     "company_info",
     JSON.stringify({
       sub_domain: "your-subdomain",
       // ... other company info
     })
   );
   ```

## Usage

```typescript
// In component
constructor(private jobBoardService: ClientJobBoardService) {}

ngOnInit() {
  this.jobBoardService.getJobListings(1, 10).subscribe({
    next: (response) => {
      // Handle response
    },
    error: (error) => {
      // Handle error
    }
  });
}
```
