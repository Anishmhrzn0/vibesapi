export interface IUser {
  _id:       string;
  fullName:  string;
  email:     string;
  phone?:     string;
  password:  string;
  createdAt: Date;
}

export interface UserResponse {
  id:        string;
  fullName:  string;
  email:     string;
  phone?:     string;
  createdAt: Date;
}

export interface AuthResult {
  user:        UserResponse;
  accessToken: string;
}