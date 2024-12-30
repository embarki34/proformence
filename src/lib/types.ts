

export type Login = {
    username: string;
    password: string;
}

export type Worker = {
    id: number;
    fullname: string;
    total_likes: number;
    total_dislikes: number;
    created_at: Date;
    updated_at: Date;
}

export type Organization = {
    id: number;
    username: string;
    password: string;
    wilaya: string;
    commune: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}
