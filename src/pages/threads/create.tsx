import { Container } from '@/components/container';
import { CreateThreadForm } from '@/features/thread/components/create-thread-form';

const CreateThreadPage = () => {
  return (
    <Container className='pb-12'>
      <div className='flex items-center min-w-lg justify-center min-h-[90vh]'>
        <CreateThreadForm />
      </div>
    </Container>
  );
};

export default CreateThreadPage;
