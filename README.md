# Roomie Match

RoomieMatch
Members: Max Siebengartner, Zain Rizvi

A centralized roommate finder database that connects people looking for housing and roommates in one system.

Project Overview
RoomieMatch models how a roommate finder platform stores users, listings, preferences, and match activity. The system centralizes all data into one relational database so relationships are clear and easy to query. It supports preference matching, listing management, and user connection logs.

Repository Structure:
proposal.pdf        # Requirements document, UML, ERD, relational schema, BCNF proof, and SQL queries
schema.md          # SQLite CREATE TABLE statements
diagrams/
  uml.png           # UML Class Diagram
  erd.png           # Crow's Foot ERD
queries/
  query1.sql        # Users Who Have a Listing Posted
  query2.sql        # Filtering Listing Reports
  query3.sql        # Simple Login Functionality
  query4.sql        # Get Number of Unread Messages Per Sender
  query5.sql        # Get Listings for Similar User Preferences
  query6.sql        # Get Listings With More Than One Interested Renter

Database:
Built with SQLite3 and managed using DB Browser for SQLite.

Tables:
User - Stores user account information
UserPreferences - Stores lifestyle preferences per user
Listing - Stores room listings posted by users
ListingPhoto - Stores photos associated with listings
ProfilePhoto - Stores user profile photos
UserInterest - Tracks user interest in listings
Message - Stores messages between users in the context of a listing
Report - Stores reports made against users or listings

ERD:
https://lucid.app/lucidchart/4b2d71d8-e729-4ea5-9cc2-468ff0ad8274/edit?viewport_loc=3089%2C-363%2C2989%2C2187%2C0_0&invitationId=inv_42059c2e-11b5-4321-b419-7e4b525f7677 


