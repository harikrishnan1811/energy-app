# Energy IQ Application

Welcome to the Energy IQ Application repository. This document provides an overview of the system design, UI/UX design, and instructions to preview the app.

### System Design

![image](https://github.com/user-attachments/assets/26d18697-f393-47b3-86ad-9043340fba79)

The diagram above illustrates the system design of the Energy IQ Application.

Please note that the Authentication and Notification Services have not been implemented yet. Additionally, a Load Balancer has not been added at this stage.

The application includes the following batch job services:

1. A batch job that runs every 15 minutes to process data from an external source and store it in the database after processing.
2. A batch job that runs daily at 12 AM to calculate insights and store them for the day.

### ER Diagram

The following diagram represents the Entity-Relationship (ER) model of the database:

![image](https://github.com/user-attachments/assets/b06f47fe-a850-4888-9de8-a8268965a02b)

### UI/UX Design

A Figma design has been created for the application, but not all screens have been designed at this stage.

Please find the link to the designs here: [Open the design](https://www.figma.com/design/5Xsi7nL62GxRmjBcBTI8mk/EnergyIQ?node-id=0-1&t=sZYFp7onBLemX1n2-1)

The application consists of the following screens:

1. **Home Screen**: Displays insights shown as a carousel.
2. **Devices Screen**: Shows a dashboard with a breakdown by device.
3. **Insights Screen**: Displays all insights and projected statistics.

### Future Scope

The following features are planned for future implementation:

1. **Authentication Service**
2. **Notification Service**
3. **Load Balancer**
4. **Goals Screen**
5. **Account Screen**

### Technical Stack

1. **Front end**: React Native, D3.Js, ChartJs
2. **Back end**: NodeJs
3. **Database**: Postgres (Hosted on Neon DB)

### Preview the App

> **Note:** The Render cloud deployment free tier has an inactivity period of 50 seconds. After the server has been inactive for 50 seconds, users will have to wait 50 seconds to see the data.

Scan the QR code to open the app in Expo GO or click the link: [Open the app](https://expo.dev/preview/update?message=Updated%20app&updateRuntimeVersion=1.0.0&createdAt=2025-01-07T15%3A55%3A38.789Z&slug=exp&projectId=d21cc783-f718-4caa-b9a0-ce26fa413382&group=8735478f-ea1a-4289-852d-83946ae97fdf)

<img width="520" alt="image" src="https://github.com/user-attachments/assets/9f2a9c49-27b8-4222-8a18-e2ff29cb5fba" />

