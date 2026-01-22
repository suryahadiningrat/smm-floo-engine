Table master.projects {
  id integer [primary key]
  user_id integer
  slug varchar
  name varchar
  metricool_user_id varchar
  metricool_blog_id varchar
}

Table master.users {
  id integer [primary key]
  plan_id integer
  email varchar
  username varchar
  created_at timestamp
}

Table master.plan {
  id integer [primary key]
  name varchar
  price integer
  project_limit integer
}

Table metric.platform_account_summary {
  id integer [primary key]
  platform project_platform
  project_id integer
  username varchar

  posts integer [default: 0]
  followers integer [default: 0]
  following integer [default: 0]

  note: 'Data terbaru akun semua platform'
}

Table metric.instagram_account {
  id integer [primary key]
  project_id integer
  username varchar

  posts integer [default: 0]
  followers integer [default: 0]
  following integer [default: 0]

  created_at datetime

  note: 'Data akun instagram per hari'
}

Table metric.instagram_content {
  id integer [primary key]
  project_id integer
  username varchar

  type instagram_type
  content_id varchar [note: 'ID Content']
  caption text
  media_url text
  views integer [default: 0, note: 'Untuk video']
  impression integer [default: 0, note: 'Untuk post']
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]
  saved integer [default: 0]
  repost integer [default: 0]

  created_at datetime

  note: 'Data content instagram per hari'
}

Table metric.instagram_content_summary {
  id integer [primary key]
  project_id integer
  username varchar

  type instagram_type
  content_id varchar [note: 'ID Content']
  caption text
  media_url text
  views integer [default: 0, note: 'Untuk video']
  impression integer [default: 0, note: 'Untuk post']
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]
  saved integer [default: 0]
  repost integer [default: 0]

  note: 'Data terbaru konten instagram per hari'
}

Table metric.instagram_comments {
  id integer [primary key]
  project_id integer
  content_id varchar
  commenters_username varchar
  text text
  comments_like integer [default: 0]
  comments_count integer [default: 0]
  sentiment varchar [note: 'Hasil analisis sentiment (positive/neutral/negative)']
  created_at datetime
  fetched_at datetime [default: `now()`]
}

Table metric.analyze_comments {
  id integer [primary key]
  project_id integer
  content_id varchar
  percentage integer [default: 0]
  json_path varchar
  created_at datetime [default: `now()`]
}

Table metric.tiktok_account {
  id integer [primary key]
  project_id integer
  username varchar

  posts integer [default: 0]
  followers integer [default: 0]
  following integer [default: 0]

  created_at datetime
}

Table metric.tiktok_content {
  id integer [primary key]
  project_id integer
  username varchar

  content_id varchar [note: 'ID Video']
  caption text
  media_url text
  view integer [default: 0]
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]
  repost integer [default: 0]

  created_at datetime
}

Table metric.tiktok_content_summary {
  id integer [primary key]
  project_id integer
  username varchar

  content_id varchar [note: 'ID Video']
  caption text
  media_url text
  posts integer [default: 0]
  view integer [default: 0]
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]
  repost integer [default: 0]
}

Table metric.youtube_account {
  id integer [primary key]
  project_id integer
  username varchar

  followers integer [default: 0]
  following integer [default: 0]

  created_at datetime
}

Table metric.youtube_content {
  id integer [primary key]
  project_id integer
  username varchar

  type youtube_type
  content_id varchar [note: 'ID Video']
  caption text
  media_url text
  posts integer [default: 0]
  view integer [default: 0]
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]

  created_at datetime
}

Table metric.youtube_content_summary {
  id integer [primary key]
  project_id integer
  username varchar

  type youtube_type
  content_id varchar [note: 'ID Video']
  caption text
  media_url text
  posts integer [default: 0]
  view integer [default: 0]
  reach integer [default: 0]
  like integer [default: 0]
  comment integer [default: 0]
  share integer [default: 0]
}

Ref: master.plan.id < master.users.plan_id
Ref: master.users.id < master.projects.user_id
Ref: master.users.id < master.notifications.user_id
Ref: master.projects.id < metric.instagram_account.project_id
Ref: master.projects.id < metric.instagram_content.project_id
Ref: master.projects.id < metric.tiktok_account.project_id
Ref: master.projects.id < metric.tiktok_content.project_id
Ref: master.projects.id < metric.youtube_account.project_id
Ref: master.projects.id < metric.youtube_content.project_id
Ref: master.projects.id < metric.platform_account_summary.project_id
Ref: master.projects.id < metric.instagram_content_summary.project_id
Ref: master.projects.id < metric.instagram_comments.project_id
Ref: master.projects.id < metric.tiktok_content_summary.project_id
Ref: master.projects.id < metric.youtube_content_summary.project_id

Enum project_platform {
  // facebook
  instagram
  // linkedin
  tiktok
  // x
  youtube
}

Enum instagram_type {
  post
  reels
  story
}

Enum youtube_type {
  short
  story
  video
}