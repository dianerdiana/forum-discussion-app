import { Container } from '@/components/container';
import { CreateThreadForm } from '@/features/thread/components/create-thread-form';

const CreateThreadPage = () => (
  <Container className='pb-12 space-y-8'>
    <div className='bg-foreground flex items-center py-4 px-4'>
      <h1 className='text-2xl font-bold text-white'>Create New Thread</h1>
    </div>
    <div className='flex items-center justify-center px-4'>
      <CreateThreadForm />
    </div>
  </Container>
);

export default CreateThreadPage;
