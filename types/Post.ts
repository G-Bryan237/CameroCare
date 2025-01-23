
// Define and export the Post type

export interface Post {

    id: string;
  
    author: string;
  
    timestamp: string;
  
    location: string;
  
    description: string;
  
    categories: string[];
  
    likes: number;
  
    isAnonymous: boolean;
  
    volunteers: { name: string; message: string }[];
  
  }
  