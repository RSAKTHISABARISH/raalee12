# Part 1: Tickets 1 to 500
PART1 = """Status,Ticket ID,Priority,Source,Topic,Agent Group,Agent Name,Created time,Expected SLA to resolve,Expected SLA to first response,First response time,SLA For first response,Resolution time,SLA For Resolution,Close time,Agent interactions,Survey results,Product group,Support Level,Country
Closed,1,High,Email,General Inquiry,Security,Khalid Al-Rashid,2024-07-04 12:42:00,2024-07-04 14:42:00,2024-07-04 13:12:00,2024-07-04 13:02:00,Met,2024-07-04 14:30:00,Met,2024-07-04 14:32:00,5,Neutral,Cloud,L3,Oman
Closed,2,High,Chat,Network Issue,Customer Service,Ahmed Al-Nasser,2024-05-23 20:03:00,2024-05-23 22:03:00,2024-05-23 20:33:00,2024-05-23 20:25:00,Met,2024-05-23 22:00:00,Met,2024-05-23 22:05:00,4,Dissatisfied,Cloud,L2,Qatar
In Progress,3,Low,Phone,General Inquiry,Development,Mohammed Al-Hamdan,2024-04-13 20:51:00,2024-04-14 00:51:00,2024-04-13 21:51:00,2024-04-13 21:41:00,Met,2024-04-14 00:57:00,Not Met,2024-04-14 00:51:00,3,Dissatisfied,Software,L1,Bahrain
Resolved,4,Critical,Chat,Access Request,Development,Mohammed Al-Hamdan,2024-05-13 12:50:00,2024-05-13 13:50:00,2024-05-13 13:00:00,2024-05-13 12:50:00,Met,2024-05-13 13:48:00,Met,2024-05-13 13:53:00,5,Dissatisfied,Network,L2,Kuwait
Closed,5,Critical,Portal,Hardware Failure,Customer Service,Hassan Al-Rashid,2024-06-19 22:51:00,2024-06-19 23:51:00,2024-06-19 23:01:00,2024-06-19 23:00:00,Met,2024-06-19 23:49:00,Met,2024-06-19 23:54:00,4,Neutral,Hardware,L3,Qatar
In Progress,6,Medium,Email,Network Issue,Customer Service,Ahmed Al-Salem,2024-04-19 03:41:00,2024-04-19 06:41:00,2024-04-19 04:26:00,2024-04-19 04:39:00,Not Met,2024-04-19 06:55:00,Not Met,2024-04-19 06:36:00,1,Dissatisfied,Software,L3,Qatar
New,7,Critical,Portal,Access Request,Security,Yousef Al-Khalifa,2024-06-10 07:16:00,2024-06-10 08:16:00,2024-06-10 07:26:00,2024-06-10 07:16:00,Met,2024-06-10 08:04:00,Met,2024-06-10 08:05:00,1,Satisfied,Software,L2,Bahrain
In Progress,8,High,Portal,General Inquiry,Network Ops,Abdullah Al-Rashid,2024-04-09 09:55:00,2024-04-09 11:55:00,2024-04-09 10:25:00,2024-04-09 10:17:00,Met,2024-04-09 11:42:00,Met,2024-04-09 11:42:00,1,Dissatisfied,Cloud,L1,UAE
Open,9,Medium,Chat,Access Request,Network Ops,Ali Al-Khalifa,2024-05-10 23:28:00,2024-05-11 02:28:00,2024-05-11 00:13:00,2024-05-11 00:09:00,Met,2024-05-11 02:11:00,Met,2024-05-11 02:16:00,2,Neutral,Hardware,L3,Saudi Arabia
Open,10,Critical,Portal,Network Issue,Customer Service,Saif Al-Rashid,2024-06-10 06:48:00,2024-06-10 07:48:00,2024-06-10 06:58:00,2024-06-10 06:55:00,Met,2024-06-10 07:29:00,Met,2024-06-10 07:33:00,3,Dissatisfied,Network,L2,Kuwait
Closed,11,Critical,Phone,General Inquiry,IT Support,Ali Al-Khalifa,2024-05-16 01:33:00,2024-05-16 02:33:00,2024-05-16 01:43:00,2024-05-16 01:58:00,Not Met,2024-05-16 02:26:00,Met,2024-05-16 02:29:00,3,Dissatisfied,Cloud,L2,Qatar
Closed,12,Medium,Phone,Access Request,IT Support,Fahad Al-Farsi,2024-07-20 02:48:00,2024-07-20 05:48:00,2024-07-20 03:33:00,2024-07-20 03:30:00,Met,2024-07-20 05:40:00,Met,2024-07-20 05:40:00,2,Neutral,Network,L2,Bahrain
Open,13,Critical,Chat,Hardware Failure,IT Support,Mohammed Al-Hamdan,2024-08-10 02:56:00,2024-08-10 03:56:00,2024-08-10 03:06:00,2024-08-10 03:06:00,Met,2024-08-10 03:44:00,Met,2024-08-10 03:48:00,5,Dissatisfied,Hardware,L2,Kuwait
New,14,High,Email,Network Issue,Development,Abdullah Al-Rashid,2024-07-15 01:46:00,2024-07-15 03:46:00,2024-07-15 02:16:00,2024-07-15 02:14:00,Met,2024-07-15 03:29:00,Met,2024-07-15 03:30:00,3,Dissatisfied,Software,L3,Qatar
In Progress,15,Low,Chat,General Inquiry,Development,Abdullah Al-Rashid,2024-08-09 09:41:00,2024-08-09 13:41:00,2024-08-09 10:41:00,2024-08-09 10:35:00,Met,2024-08-09 13:35:00,Met,2024-08-09 13:38:00,5,Satisfied,Hardware,L1,Saudi Arabia
New,16,High,Email,Software Bug,Security,Khalid Al-Rashid,2024-05-30 02:09:00,2024-05-30 04:09:00,2024-05-30 02:39:00,2024-05-30 02:53:00,Not Met,2024-05-30 03:49:00,Met,2024-05-30 03:52:00,1,Satisfied,Network,L3,Saudi Arabia
Closed,17,High,Portal,Software Bug,Network Ops,Fahad Al-Rashid,2024-05-25 02:26:00,2024-05-25 04:26:00,2024-05-25 02:56:00,2024-05-25 02:56:00,Met,2024-05-25 04:22:00,Met,2024-05-25 04:25:00,2,Dissatisfied,Software,L2,UAE
Resolved,18,Medium,Portal,Hardware Failure,Security,Abdullah Al-Farsi,2024-06-24 18:34:00,2024-06-24 21:34:00,2024-06-24 19:19:00,2024-06-24 19:11:00,Met,2024-06-24 21:27:00,Met,2024-06-24 21:29:00,4,Dissatisfied,Software,L1,Saudi Arabia
New,19,Medium,Phone,Network Issue,Network Ops,Saif Al-Khalifa,2024-08-05 08:52:00,2024-08-05 11:52:00,2024-08-05 09:37:00,2024-08-05 09:31:00,Met,2024-08-05 11:38:00,Met,2024-08-05 11:39:00,4,Satisfied,Network,L2,Qatar
In Progress,20,Medium,Chat,Access Request,Customer Service,Hassan Al-Hamdan,2024-07-20 13:26:00,2024-07-20 16:26:00,2024-07-20 14:11:00,2024-07-20 14:31:00,Not Met,2024-07-20 16:12:00,Met,2024-07-20 16:16:00,1,Satisfied,Network,L1,Qatar
Closed,21,High,Chat,Software Bug,Security,Mohammed Al-Hamdan,2024-06-23 12:13:00,2024-06-23 14:13:00,2024-06-23 12:43:00,2024-06-23 12:39:00,Met,2024-06-23 14:12:00,Met,2024-06-23 14:14:00,4,Dissatisfied,Software,L3,UAE
Closed,22,Medium,Portal,Software Bug,IT Support,Yousef Al-Khalifa,2024-05-09 23:25:00,2024-05-10 02:25:00,2024-05-10 00:10:00,2024-05-10 00:01:00,Met,2024-05-10 02:13:00,Met,2024-05-10 02:18:00,5,Dissatisfied,Hardware,L3,Oman
Closed,23,Critical,Phone,Access Request,Network Ops,Fahad Al-Rashid,2024-05-05 12:31:00,2024-05-05 13:31:00,2024-05-05 12:41:00,2024-05-05 12:41:00,Met,2024-05-05 13:23:00,Met,2024-05-05 13:25:00,2,Dissatisfied,Network,L2,UAE
Open,24,Critical,Email,Hardware Failure,IT Support,Ali Al-Khalifa,2024-05-05 03:28:00,2024-05-05 04:28:00,2024-05-05 03:38:00,2024-05-05 03:36:00,Met,2024-05-05 04:10:00,Met,2024-05-05 04:15:00,5,Satisfied,Network,L1,Oman
Open,25,High,Email,Hardware Failure,Security,Abdullah Al-Rashid,2024-06-20 20:04:00,2024-06-20 22:04:00,2024-06-20 20:34:00,2024-06-20 20:32:00,Met,2024-06-20 21:55:00,Met,2024-06-20 21:57:00,3,Neutral,Cloud,L1,Kuwait
Closed,26,Medium,Email,Hardware Failure,Network Ops,Omar Al-Salem,2024-08-08 11:13:00,2024-08-08 14:13:00,2024-08-08 11:58:00,2024-08-08 11:58:00,Met,2024-08-08 14:00:00,Met,2024-08-08 14:00:00,1,Satisfied,Software,L3,Bahrain
Open,27,Critical,Chat,Network Issue,Network Ops,Abdullah Al-Rashid,2024-07-01 10:55:00,2024-07-01 11:55:00,2024-07-01 11:05:00,2024-07-01 10:58:00,Met,2024-07-01 11:44:00,Met,2024-07-01 11:49:00,2,Dissatisfied,Cloud,L3,Kuwait
Resolved,28,Critical,Portal,Software Bug,Customer Service,Ahmed Al-Salem,2024-04-23 06:24:00,2024-04-23 07:24:00,2024-04-23 06:34:00,2024-04-23 06:39:00,Not Met,2024-04-23 07:12:00,Met,2024-04-23 07:16:00,4,Dissatisfied,Cloud,L2,Bahrain
In Progress,29,Medium,Portal,Hardware Failure,Customer Service,Abdullah Al-Rashid,2024-04-15 01:24:00,2024-04-15 04:24:00,2024-04-15 02:09:00,2024-04-15 02:00:00,Met,2024-04-15 04:06:00,Met,2024-04-15 04:08:00,5,Satisfied,Cloud,L2,UAE
Closed,30,High,Portal,Network Issue,Network Ops,Ali Al-Khalifa,2024-04-22 18:39:00,2024-04-22 20:39:00,2024-04-22 19:09:00,2024-04-22 19:02:00,Met,2024-04-22 20:39:00,Met,2024-04-22 20:40:00,2,Neutral,Hardware,L3,Qatar
"""

with open('src/main/resources/tickets_dataset.csv', 'w', encoding='utf-8') as f:
    f.write(PART1.strip() + '\n')
print("Wrote Part 1")
