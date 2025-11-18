-- Create advice_history table to store AI recommendations
CREATE TABLE public.advice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  advice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.advice_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own advice history" 
ON public.advice_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own advice history" 
ON public.advice_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own advice history" 
ON public.advice_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_advice_history_updated_at
BEFORE UPDATE ON public.advice_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();