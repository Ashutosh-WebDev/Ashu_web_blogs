export interface BlogImage {
  data: string;
  contentType: string;
  filename?: string;
}

export interface Blog {
  id: string;
  _id?: string; // For MongoDB compatibility
  title: string;
  googleDriveLink: string;
  image: string | BlogImage;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  featured?: boolean;
}

export interface BlogFormData {
  title: string;
  googleDriveLink: string;
  image: FileList | string | BlogImage;
  featured?: boolean;
}

export interface BlogCardProps {
  blog: Blog;
  onEdit: () => void;
  onDelete: () => void;
}

export interface BlogFormProps {
  initialData?: BlogFormData;
  onSubmit: (data: BlogFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}