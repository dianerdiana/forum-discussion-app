const FallbackSpinner = () => {
  return (
    <div className='flex items-center justify-center h-screen w-full bg-background fixed left-0 top-0 z-50'>
      <div className='flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <p>Loading</p>
        </div>
      </div>
    </div>
  );
};

export default FallbackSpinner;
