export type UserRole = 'student' | 'admin' | 'teacher';
export type StudentClass = '6th' | '7th' | '8th' | '9th' | '10th';
export type ExamStatus = 'draft' | 'published' | 'scheduled' | 'completed' | 'archived';
export type TimerMode = 'question' | 'exam' | 'none';
export type NavigationMode = 'both' | 'next_only';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';
export type AttemptStatus = 'in_progress' | 'submitted' | 'abandoned' | 'expired';
export type ResultStatus = 'pass' | 'fail';
export type SuspiciousEventType = 
  | 'tab_switch' 
  | 'fullscreen_exit' 
  | 'window_blur' 
  | 'page_hidden' 
  | 'copy_attempt' 
  | 'context_menu' 
  | 'multiple_sessions' 
  | 'reloaded';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  class: StudentClass;
  school_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  class: StudentClass;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  class: StudentClass;
  subject_id: string | null;
  topic: string | null;
  status: ExamStatus;
  scheduled_at: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_seconds: number;
  timer_mode: TimerMode;
  navigation_mode: NavigationMode;
  total_marks: number;
  passing_marks: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  negative_marking_enabled: boolean;
  show_results: boolean;
  allow_review: boolean;
  max_attempts: number;
  instructions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  subject?: Subject;
  question_count?: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  image_url: string | null;
  display_order: number;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  image_url: string | null;
  marks: number;
  negative_marks: number;
  time_limit_seconds: number;
  explanation: string | null;
  display_order: number;
  created_at: string;
  options?: QuestionOption[];
}

export interface AnswerKey {
  id: string;
  question_id: string;
  correct_option_ids: string[];
  created_at: string;
}

export interface Attempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  time_taken_seconds: number;
  score: number;
  percentage: number;
  created_at: string;
  // Joined fields
  exam?: Exam;
  student?: Profile;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_answered: boolean;
  saved_at: string;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  student_id: string;
  exam_id: string;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  result_status: ResultStatus;
  published_at: string;
  created_at: string;
  // Joined
  exam?: Exam;
  student?: Profile;
}

export interface SuspiciousEvent {
  id: string;
  student_id: string;
  exam_id: string;
  attempt_id: string;
  event_type: SuspiciousEventType;
  event_metadata: Record<string, any>;
  occurred_at: string;
  // Joined
  student?: Profile;
  exam?: Exam;
}

export interface QuestionBankItem {
  id: string;
  question_text: string;
  question_type: QuestionType;
  class: StudentClass;
  subject_id: string | null;
  topic: string | null;
  marks: number;
  negative_marks: number;
  explanation: string | null;
  options: string[];
  correct_options: string[];
  created_by: string | null;
  created_at: string;
  subject?: Subject;
}

export interface ReviewQuestionItem {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  image_url: string | null;
  marks: number;
  negative_marks: number;
  explanation: string | null;
  display_order: number;
  options: {
    id: string;
    text: string;
    image_url: string | null;
    display_order: number;
  }[];
  selected_option_ids: string[];
  is_answered: boolean;
  correct_option_ids: string[];
}

export type NotificationType = 'exam' | 'reminder' | 'urgent' | 'result' | 'general';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  target_class: 'all' | StudentClass;
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

